#ifndef __THREADED_MRI_RUBY_COMPILER__H__
#define __THREADED_MRI_RUBY_COMPILER__H__

#include <StandardRubyCompiler.h>

class ThreadedMRIRubyCompiler: public coldruby::StandardRubyCompiler {
	enum {
		MsgPing = 0x01,
		MsgQuit = 0x02,
		MsgBoot = 0x03,
		MsgCompile = 0x04
	};

	typedef struct {
		long type;
		void *data;
	} ipc_msg_t;

	typedef struct {
		// args
		std::string code;
		std::string file;
		std::string epilogue;

		// response
		bool is_ok;
		std::string error;
		std::string js;
		std::vector<coldruby::ColdRubyRuntime> runtime;
	} boot_data_t;

public:
	ThreadedMRIRubyCompiler();
	virtual ~ThreadedMRIRubyCompiler();

	virtual int initialize(post_init_t post_init, void *arg);
	virtual bool boot(const std::string &code, const std::string &file, const std::string &epilogue);
	//virtual bool boot(const std::string &file, const std::string &epilogue);
	virtual bool compile(const std::string &code, const std::string &file, std::string &js, const std::string &epilogue);
	//virtual bool compile(const std::string &file, std::string &js, const std::string &epilogue);
	virtual const std::vector<coldruby::ColdRubyRuntime> &runtime() const;

private:
	bool sendBootRequest(long msg, boot_data_t *data);

	static void *threadWrapper(void *arg);
	static int threadPostInit(coldruby::RubyCompiler *compiler, void *arg);
	void thread(coldruby::RubyCompiler *compiler, char *dummy);
	void ipc(ipc_msg_t *msg);

	std::vector<coldruby::ColdRubyRuntime> m_runtime;
	int m_send, m_receive;

	pthread_t m_thread;
};

#endif

