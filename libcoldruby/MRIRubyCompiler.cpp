/*
 * ColdRuby -- V8-based Ruby implementation.
 * Copyright (C) 2011  Sergey Gridassov <grindars@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */



#include <sstream>

#include "MRIRubyCompiler.h"

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif

#ifdef STACK_END_ADDRESS
#include <sys/mman.h>
#endif

#ifdef STACK_END_ADDRESS
extern void *STACK_END_ADDRESS;

#define RUBY_PROLOGUE \
	do { \
		char stack_dummy;\
		do {\
			void *stack_backup = STACK_END_ADDRESS; \
			STACK_END_ADDRESS = &stack_dummy;

#define RUBY_EPILOGUE \
			STACK_END_ADDRESS = stack_backup; \
		} while(0); \
	} while(0);
#else
#define RUBY_PROLOGUE
#define RUBY_EPILOGUE
#endif

using namespace coldruby;

void MRIRubyCompiler::sysinit(int *argc, char ***argv) {
	ruby_sysinit(argc, argv);
}

int MRIRubyCompiler::initialize(int (*post_init)(RubyCompiler *compiler, void *arg), void *arg) {
#ifdef STACK_END_ADDRESS
	int page = sysconf(_SC_PAGE_SIZE);
	mprotect((void *)((unsigned long)&STACK_END_ADDRESS & ~(page - 1)), page, PROT_READ | PROT_WRITE | PROT_EXEC);
#endif

	RUBY_PROLOGUE

	RUBY_INIT_STACK;

	ruby_init();

	RUBY_EPILOGUE
	return post_init(this, arg);
}

bool MRIRubyCompiler::boot(const std::string &code, const std::string &file, const std::string &epilogue) {
	std::string dummy;
	compile_data_t boot = { this, code, file, dummy, epilogue };

	int state;

	RUBY_PROLOGUE
	rb_protect(boot_protected_wrapper, (VALUE) &boot, &state);
	RUBY_EPILOGUE

	if(state != 0) {
		mri_exception();

		return false;
	}

	return true;
}

VALUE MRIRubyCompiler::boot_protected_wrapper(VALUE arg) {
	compile_data_t *boot = (compile_data_t *) arg;

	boot->this_compiler->boot_protected(boot);

	return Qnil;
}

void MRIRubyCompiler::boot_protected(compile_data_t *boot) {
	VALUE lib_path = rb_gv_get("$:");
	rb_ary_push(lib_path, rb_str_new_cstr(COMPILER_ROOT));

	VALUE code = rb_str_new(boot->code.data(), boot->code.length());
	VALUE file = rb_str_new(boot->file.data(), boot->file.length());

	rb_funcall(Qnil, rb_intern("eval"), 4, code, Qnil, file, INT2FIX(1));

	VALUE runtime;

	if(boot->epilogue.empty())
		runtime = rb_funcall(Qnil, rb_intern("get_runtime"), 1, rb_str_new_cstr(RUNTIME_ROOT));
	else
		runtime = rb_funcall(Qnil, rb_intern("get_runtime"), 2, rb_str_new_cstr(RUNTIME_ROOT), rb_str_new_cstr(boot->epilogue.c_str()));

	m_runtime.resize(RARRAY_LEN(runtime));

	for(long i = 0; i < RARRAY_LEN(runtime); i++) {
		VALUE item = rb_ary_entry(runtime, i);

		std::string filename = RSTRING_STD(rb_ary_entry(item, 0));
		std::string code = RSTRING_STD(rb_ary_entry(item, 1));

		m_runtime[i] = ColdRubyRuntime(code, filename);
	}

}

void MRIRubyCompiler::mri_exception() {
	std::ostringstream stream;

	const char *file = rb_sourcefile();
	int line = rb_sourceline();

	if(file == 0)
		stream << "<unknown>";
	else
		stream << file;

	if(line)
		stream << ":" << line;

	stream << ": ";

	VALUE exception = rb_gv_get("$!");

	VALUE exception_class = rb_class_path(CLASS_OF(exception));

	if(TYPE(exception_class) == T_STRING) {
		stream << RSTRING_STD(exception_class);
	} else {
		stream << "[invalid exception class]";
	}

	VALUE message = rb_obj_as_string(exception);

	stream << ": " << RSTRING_STD(message);

	setErrorString(stream.str());
}

bool MRIRubyCompiler::compile(const std::string &code, const std::string &file, std::string &js, const std::string &epilogue) {
	compile_data_t compile = { this, code, file, js, epilogue };

	int state;

	RUBY_PROLOGUE
	rb_protect(compile_protected_wrapper, (VALUE) &compile, &state);
	RUBY_EPILOGUE

	if(state != 0) {
		mri_exception();

		return false;
	}

	return true;
}

VALUE MRIRubyCompiler::compile_protected_wrapper(VALUE arg) {
	compile_data_t *compile = (compile_data_t *) arg;

	compile->this_compiler->compile_protected(compile);

	return Qnil;
}

void MRIRubyCompiler::compile_protected(compile_data_t *data) {
	RUBY_PROLOGUE
	VALUE code = rb_str_new(data->code.data(), data->code.length());
	VALUE file = rb_str_new(data->file.data(), data->file.length());

	VALUE js;

	if(data->epilogue.empty())
		js = rb_funcall(Qnil, rb_intern("compile"), 3, code, file, INT2FIX(1));
	else
		js = rb_funcall(Qnil, rb_intern("compile"), 4, code, file, INT2FIX(1), rb_str_new_cstr(data->epilogue.c_str()));

	data->js = RSTRING_STD(js);
	RUBY_EPILOGUE
}

const std::vector<ColdRubyRuntime> &MRIRubyCompiler::runtime() const {
	return m_runtime;
}

