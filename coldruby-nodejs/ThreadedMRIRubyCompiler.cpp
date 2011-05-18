#include <sys/ipc.h>
#include <sys/msg.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdexcept>
#include <string.h>
#include <errno.h>
#include <MRIRubyCompiler.h>

#include "ThreadedMRIRubyCompiler.h"

ThreadedMRIRubyCompiler::ThreadedMRIRubyCompiler() : StandardRubyCompiler() {
	m_send = msgget(IPC_PRIVATE, IPC_CREAT | S_IRUSR | S_IWUSR);

	if(m_send == -1)
		throw std::runtime_error(strerror(errno));

	m_receive = msgget(IPC_PRIVATE, IPC_CREAT | S_IRUSR | S_IWUSR);

	if(m_receive == -1) {
		msgctl(m_send, IPC_RMID, NULL);

		throw std::runtime_error(strerror(errno));
	}

	if(pthread_create(&m_thread, NULL, threadWrapper, this) == -1) {
		msgctl(m_send, IPC_RMID, NULL);
		msgctl(m_receive, IPC_RMID, NULL);

		throw std::runtime_error(strerror(errno));
	}

	ipc_msg_t ping;
	ping.type = MsgPing;
	ping.data = 0x00;

	ipc(&ping);
}

ThreadedMRIRubyCompiler::~ThreadedMRIRubyCompiler() {
	ipc_msg_t quit;
	quit.type = MsgQuit;
	quit.data = 0x00;
	msgsnd(m_send, &quit, sizeof(void *), 0);

	pthread_join(m_thread, NULL);

	msgctl(m_send, IPC_RMID, NULL);
	msgctl(m_receive, IPC_RMID, NULL);
}

void ThreadedMRIRubyCompiler::ipc(ipc_msg_t *msg) {
	ipc_msg_t reply;

	msgsnd(m_send, msg, sizeof(void *), 0);
	msgrcv(m_receive, &reply, sizeof(void *), 0, 0);
}

int ThreadedMRIRubyCompiler::initialize(post_init_t post_init, void *arg) {
	return post_init(this, arg);
}

bool ThreadedMRIRubyCompiler::sendBootRequest(long msg, boot_data_t *boot_data) {
	ipc_msg_t boot;
	boot.type = msg;
	boot.data = boot_data;
	ipc(&boot);

	if(!boot_data->is_ok)
		setErrorString(boot_data->error);

	return boot_data->is_ok;
}

bool ThreadedMRIRubyCompiler::boot(const std::string &code, const std::string &file, const std::string &epilogue) {
	boot_data_t boot_data = { code, file, epilogue };

	bool ret = sendBootRequest(MsgBoot, &boot_data);

	if(ret)
		m_runtime = boot_data.runtime;

	return ret;
}


bool ThreadedMRIRubyCompiler::compile(const std::string &code, const std::string &file, std::string &js, const std::string &epilogue) {
	boot_data_t compile_data = { code, file, epilogue };

	bool ret = sendBootRequest(MsgCompile, &compile_data);

	if(ret)
		js = compile_data.js;

	return ret;
}

const std::vector<ColdRubyRuntime> &ThreadedMRIRubyCompiler::runtime() const {
	return m_runtime;
}

void *ThreadedMRIRubyCompiler::threadWrapper(void *arg) {
	int argc = 1;
	const char *array[] = { "dummy", NULL };
	char **argv = (char **) array;

	MRIRubyCompiler::sysinit(&argc, &argv);

	MRIRubyCompiler *compiler = new MRIRubyCompiler();

	compiler->initialize(threadPostInit, arg);

	delete compiler;
	return NULL;
}

int ThreadedMRIRubyCompiler::threadPostInit(RubyCompiler *compiler, void *arg) {
	char dummy;

	static_cast<ThreadedMRIRubyCompiler *>(arg)->thread(compiler, &dummy);

	return 0;
}

void ThreadedMRIRubyCompiler::thread(RubyCompiler *compiler, char *dummy) {
	ipc_msg_t msg;

	do {
		if(msgrcv(m_send, &msg, sizeof(void *), 0, 0) != sizeof(void *))
			break;

		boot_data_t *boot = (boot_data_t *) msg.data;

		switch(msg.type) {
		case MsgPing:
			msgsnd(m_receive, &msg, sizeof(void *), 0);

			break;

		case MsgBoot:
			if(compiler->boot(boot->code, boot->file, boot->epilogue)) {
				boot->runtime = compiler->runtime();
				boot->is_ok = true;
			} else {
				boot->error = compiler->errorString();
				boot->is_ok = false;
			}

			msgsnd(m_receive, &msg, sizeof(void *), 0);

			break;
		}

		printf("type = %lu, data = %p\n", msg.type, msg.data);
	} while(msg.type != MsgQuit);
}

