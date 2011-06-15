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

#include <sys/stat.h>
#include <errno.h>
#include <string.h>

#include "ColdRuby.h"
#include "ColdRubyVM.h"
#include "ColdRubyException.h"
#include "ColdRubyExtension.h"
#include "RubyCompiler.h"
#include "LoadedExtension.h"

using namespace v8;
using namespace coldruby;

ColdRuby::ColdRuby(ColdRubyVM *vm, Handle<Object> ruby) : m_vm(vm), m_ruby(Persistent<Object>::New(ruby)) {

}

ColdRuby::~ColdRuby() {
	for(std::vector<LoadedExtension *>::const_iterator it = m_loaded_extensions.begin(); it != m_loaded_extensions.end(); it++) {
		delete (*it);
	}

	if(!m_ruby.IsWeak())
		m_ruby.Dispose();
}

void ColdRuby::initialize() {
	std::vector<std::string> default_path;
	default_path.push_back(EXTENSION_ROOT);
	default_path.push_back(STDLIB_ROOT);
	setSearchPath(default_path);
	
	std::string kernel = resolve("kernel");
	if(kernel.empty())
		throw ColdRubyException("Initialization failed", "kernel extension not found");

	runElf(kernel);

	printf("kernel is here.\n");
}

void ColdRuby::delegateToJS() {
	if(!m_ruby.IsWeak()) {
		m_ruby.MakeWeak(this, rubyDisposed);
	}
}

Handle<Object> ColdRuby::ruby() const {
	return m_ruby;
}

void ColdRuby::run(const std::string &code, const std::string &file) {
	std::string js;

	RubyCompiler *compiler = m_vm->compiler();

	if(compiler->compile(code, file, js, std::string()) == false)
		throw ColdRubyException("Compilation failed", compiler->errorString());

	if(m_vm->runRubyJS(this, js, file) == false)
		throw ColdRubyException(m_vm->errorString());
}

void ColdRuby::run(const std::string &file) {
	std::string js;

	RubyCompiler *compiler = m_vm->compiler();

	if(compiler->compile(file, js, std::string()) == false)
		throw ColdRubyException("Compilation failed", m_vm->errorString());

	if(m_vm->runRubyJS(this, js, file) == false)
		throw ColdRubyException(m_vm->errorString());
}

void ColdRuby::setErrorString(const std::string &string) {
	m_errorString = string;
}

const std::string &ColdRuby::errorString() const {
	return m_errorString;
}

Handle<Function> ColdRuby::pullFunction(const char *name) {
	Handle<Value> ref = m_ruby->Get(String::New(name));

	if(!ref->IsFunction())
		throw ColdRubyException("Internal error", "ruby." + std::string(name) + " is invalid");
	
	printf("%s -> %p\n", name, *(ref.As<Function>()));
	
	return ref.As<Function>();
}

Handle<Object> ColdRuby::pullObject(const char *name) {
	Handle<Value> ref = m_ruby->Get(String::New(name));

	if(!ref->IsObject())
		throw ColdRubyException("Internal error", "ruby." + std::string(name) + " is invalid");

	return ref->ToObject();
}

std::vector<std::string> ColdRuby::searchPath() {
	std::vector<std::string> path;

	HandleScope handle_scope;
	Context::Scope context_scope(m_vm->m_context);
	
	Handle<Value> gvar = gvar_get(v8::String::New("$:"));
	
	if(!gvar->IsObject())
		return path;
	
	Handle<Array> pathArray = to_ary(gvar->ToObject());
	
	int len = pathArray->Length();

	path.resize(len);

	for(int i = 0; i < len; i++) {
		Handle<Value> val = pathArray->Get(i);

		if(!val->IsObject()) 
			return path;

		std::string item;
		String::Utf8Value str(to_str(val->ToObject()));

		if(str.length() > 0) {
			item.assign(*str, str.length());
		}

		path[i] = item;
	}

	return path;
}

void ColdRuby::setSearchPath(std::vector<std::string> path) {
	HandleScope handle_scope;
	Context::Scope context_scope(m_vm->m_context);

	int count = path.size();

	Handle<Array> pathArray = Array::New(count);

	for(int i = 0; i < count; i++) {
		std::string item = path.at(i);

		pathArray->Set(i, string_new(String::New(item.data(), item.length())));
	}
	
	gvar_set(String::New("$:"), pathArray);
}

#define DO_RUBY_CALL(func, argc, ...) \
	HandleScope handle_scope; \
	Context::Scope context_scope(m_vm->m_context); \
	Handle<Function> func = pullFunction(#func); \
	TryCatch try_catch; \
	Handle<Value> args[] = { __VA_ARGS__ }; \
	Handle<Value> ret = func->Call(m_ruby, argc, args); \
	if(try_catch.HasCaught()) { \
		m_vm->formatException(&try_catch, this); \
		throw ColdRubyException(m_vm->errorString()); \
	}

#define RETURN_CHECK_TYPE(func, type) \
	if(ret.IsEmpty() || ! ret->Is ## type ()) \
		throw ColdRubyException("Internal error", #func + \
			std::string(" returned something other than ") + #type); \
	return handle_scope.Close(ret->To ## type ());

#define RETURN_TYPE(func, type) \
	if(! ret->Is ## type ()) \
		throw ColdRubyException("Internal error", #func + \
			std::string(" returned something other than ") + #type); \
	return ret->type ## Value ();

#define RETURN_VALUE() \
	return handle_scope.Close(ret);

/* Global variables */

bool ColdRuby::gvar_defined(Handle<String> name) {
	DO_RUBY_CALL(gvar_defined, 1, name);
	RETURN_TYPE(gvar_defined, Boolean);
}

void ColdRuby::gvar_alias(Handle<String> name, Handle<String> other) {
	DO_RUBY_CALL(gvar_alias, 2, name, other)
}

Local<Value> ColdRuby::gvar_get(Handle<String> name) {
	DO_RUBY_CALL(gvar_get, 1, name);
	RETURN_VALUE();
}

void ColdRuby::gvar_set(Handle<String> name, Handle<Value> value) {
	DO_RUBY_CALL(gvar_set, 2, name, value);
}

/* Constants */

bool ColdRuby::const_defined(Handle<Value> scope, Handle<String> name,
		bool inherit) {
	DO_RUBY_CALL(const_defined, 3, scope, name, Boolean::New(inherit));
	RETURN_TYPE(const_defined, Boolean);
}

Local<Value> ColdRuby::const_get(Handle<Value> scope, Handle<String> name,
		bool inherit) {
	DO_RUBY_CALL(const_get, 3, scope, name, Boolean::New(inherit));
	RETURN_VALUE();
}

void ColdRuby::const_set(Handle<Value> scope, Handle<String> name,
		Handle<Value> value) {
	DO_RUBY_CALL(const_set, 3, scope, name, value);
}

/* Class variables */

bool ColdRuby::cvar_defined(Handle<Value> scope, Handle<String> name) {
	DO_RUBY_CALL(cvar_defined, 2, scope, name);
	RETURN_TYPE(cvar_defined, Boolean);
}

Local<Value> ColdRuby::cvar_get(Handle<Value> scope, Handle<String> name) {
	DO_RUBY_CALL(cvar_get, 2, scope, name);
	RETURN_VALUE();
}

void ColdRuby::cvar_set(Handle<Value> scope, Handle<String> name,
		Handle<Value> value) {
	DO_RUBY_CALL(cvar_set, 3, scope, name, value);
}

Local<Value> ColdRuby::cvar_remove(Handle<Value> scope, Handle<String> name) {
	DO_RUBY_CALL(cvar_remove, 2, scope, name);
	RETURN_VALUE();
}

/* Modules and classes */

Local<Object> ColdRuby::define_module(Handle<String> name) {
	DO_RUBY_CALL(define_module, 1, name);
	RETURN_CHECK_TYPE(define_module, Object);
}

Local<Object> ColdRuby::define_class(Handle<String> name, Handle<Object> super) {
	DO_RUBY_CALL(define_class, 2, name, super);
	RETURN_CHECK_TYPE(define_module, Object);
}

Local<Object> ColdRuby::get_singleton(Handle<Object> object) {
	DO_RUBY_CALL(get_singleton, 1, object);
	RETURN_CHECK_TYPE(define_module, Object);
}

void ColdRuby::module_include(Handle<Object> target, Handle<Object> module) {
	DO_RUBY_CALL(module_include, 2, target, module);
}

void ColdRuby::define_method(Handle<Object> klass, Handle<String> name,
		int want_args, Handle<Function> closure) {
	DO_RUBY_CALL(define_method, 4, klass, name, Integer::New(want_args), closure);
}

void ColdRuby::define_singleton_method(Handle<Object> klass, Handle<String> name,
		int want_args, Handle<Function> closure) {
	DO_RUBY_CALL(define_singleton_method, 4, klass, name, Integer::New(want_args), closure);
}

void ColdRuby::alias_method(Handle<Object> klass, Handle<String> name,
		Handle<String> other_name) {
	DO_RUBY_CALL(alias_method, 3, klass, name, other_name);
}

void ColdRuby::attr(Handle<String> type, Handle<Object> klass,
		Handle<String> method) {
	DO_RUBY_CALL(attr, 3, type, klass, method);
}

void ColdRuby::attr(Handle<String> type, Handle<Object> klass,
		Handle<Array> methods) {
	DO_RUBY_CALL(attr, 3, type, klass, methods);
}

/* Tests and checks */

bool ColdRuby::test(Handle<Object> object) {
	DO_RUBY_CALL(test, 1, object);
	RETURN_TYPE(test, Boolean);
}

bool ColdRuby::respond_to(Handle<Object> object, Handle<String> method) {
	DO_RUBY_CALL(respond_to, 2, object, method);
	RETURN_TYPE(respond_to, Boolean);
}

bool ColdRuby::obj_is_kind_of(Handle<Object> object, Handle<Object> klass) {
	DO_RUBY_CALL(respond_to, 2, object, klass);
	RETURN_TYPE(respond_to, Boolean);
}

Local<String> ColdRuby::obj_classname(Handle<Object> object) {
	DO_RUBY_CALL(obj_classname, 1, object);
	RETURN_CHECK_TYPE(respond_to, String);
}

void ColdRuby::check_args(Handle<Array> arguments, int required, int optional) {
	DO_RUBY_CALL(check_args, 3, arguments, Integer::New(required),
		Integer::New(optional));
}

void ColdRuby::check_type(Handle<Object> arg, Handle<Object> type) {
	DO_RUBY_CALL(check_type, 2, arg, type);
}

void ColdRuby::check_type(Handle<Object> arg, Handle<Array> types) {
	DO_RUBY_CALL(check_type, 2, arg, types);
}

void ColdRuby::check_convert_type(Handle<Object> arg, Handle<Object> type,
		Handle<String> converter) {
	DO_RUBY_CALL(check_convert_type, 3, arg, type, converter);
}

/* Exceptions */

void ColdRuby::raise(Handle<Object> templ, Handle<String> message,
		Handle<Value> backtrace, int skip) {
	DO_RUBY_CALL(raise, 4, templ, message, backtrace, Integer::New(skip));
}

void ColdRuby::raise2(Handle<Object> templ, Handle<Array> arguments,
		Handle<Value> backtrace, int skip) {
	DO_RUBY_CALL(raise2, 4, templ, arguments, backtrace, Integer::New(skip));
}

void ColdRuby::raise3(Handle<Object> exception) {
	DO_RUBY_CALL(raise3, 1, exception);
}

/* Execution */

Local<Object> ColdRuby::funcall2(Handle<Object> receiver, Handle<String> method,
		Handle<Array> arguments, Handle<Value> block, bool vcall) {
	DO_RUBY_CALL(funcall2, 5, receiver, method, arguments, block,
		Boolean::New(vcall));
	RETURN_CHECK_TYPE(funcall2, Object);
}

Local<Object> ColdRuby::super2(Handle<Array> arguments, Handle<Value> block) {
	DO_RUBY_CALL(super2, 2, arguments, block);
	RETURN_CHECK_TYPE(super2, Object);
}

Local<Object> ColdRuby::super3() {
	DO_RUBY_CALL(super3, 0);
	RETURN_CHECK_TYPE(super3, Object);
}

bool ColdRuby::block_given_p() {
	DO_RUBY_CALL(block_given_p, 0);
	RETURN_TYPE(block_given_p, Boolean);
}

Local<Object> ColdRuby::block_proc() {
	DO_RUBY_CALL(block_proc, 0);
	RETURN_CHECK_TYPE(block_proc, Object);
}

Local<Object> ColdRuby::block_lambda() {
	DO_RUBY_CALL(block_proc, 0);
	RETURN_CHECK_TYPE(block_proc, Object);
}

Local<Object> ColdRuby::lambda(Handle<Function> closure, int want_args) {
	DO_RUBY_CALL(lambda, 2, closure, Integer::New(want_args));
	RETURN_CHECK_TYPE(lambda, Object);
}

Local<Object> ColdRuby::yield2(Handle<Array> arguments) {
	DO_RUBY_CALL(yield2, 1, arguments);
	RETURN_CHECK_TYPE(yield2, Object);
}

/* Type coercion */

int ColdRuby::to_int(Handle<Object> value) {
	DO_RUBY_CALL(to_int, 1, value);

	if(!ret->IsNumber())
		throw ColdRubyException("Internal error", "to_int returned something other than number");

	return ret->IntegerValue();
}

Local<String> ColdRuby::to_str(Handle<Object> value) {
	DO_RUBY_CALL(to_str, 1, value);

	if(!ret->IsObject())
		throw ColdRubyException("Internal error", "to_ary returned something other than string");

	ret = ret->ToObject()->Get(String::New("value"));

	RETURN_CHECK_TYPE(to_str, String);
}

Local<Array> ColdRuby::to_ary(Handle<Object> value) {
	DO_RUBY_CALL(to_ary, 1, value);
	if(!ret->IsArray())
		throw ColdRubyException("Internal error", "to_ary returned something other than array");

	return handle_scope.Close(ret.As<Array>());
}

Local<Object> ColdRuby::to_sym(Handle<Object> value) {
	DO_RUBY_CALL(to_sym, 1, value);
	RETURN_CHECK_TYPE(to_sym, Object);
}

Local<Object> ColdRuby::to_float(Handle<Object> value) {
	DO_RUBY_CALL(to_float, 1, value);
	RETURN_CHECK_TYPE(to_float, Object);
}

Local<Object> ColdRuby::to_block(Handle<Object> value) {
	DO_RUBY_CALL(to_block, 1, value);
	RETURN_CHECK_TYPE(to_block, Object);
}

Local<Object> ColdRuby::string_new(Handle<String> value) {
	DO_RUBY_CALL(string_new, 1, value);
	RETURN_CHECK_TYPE(string_new, Object);
}

void ColdRuby::rubyDisposed(v8::Persistent<v8::Value> object, void *arg) {
	delete static_cast<ColdRuby *>(arg);
}

std::string ColdRuby::resolve(const std::string &name) {
	if(loadableFile(name))
		return name;

	size_t slash_off = name.rfind('/');
	std::vector<std::string> dirs;
	std::string basename;

	if(slash_off == std::string::npos) {
		basename = name;
		dirs = searchPath();
	} else {
		dirs.push_back(name.substr(0, slash_off + 1));
		basename = name.substr(slash_off + 1);
	}
	
	for(std::vector<std::string>::const_iterator it = dirs.begin();
	    it != dirs.end();
	    it++) {
		for(int i = 0; m_ext_types[i].prefix != NULL; i++) {
			std::string name = *it + "/" + std::string(m_ext_types[i].prefix) + basename + std::string(m_ext_types[i].suffix);

			if(loadableFile(name))
				return name;
		}
	}
	
	return std::string();
}

bool ColdRuby::loadableFile(const std::string &name) {
	struct stat statbuf;

	return stat(name.c_str(), &statbuf) == 0 && S_ISREG(statbuf.st_mode);
}

void ColdRuby::runElf(const std::string &file) {
	for(std::vector<LoadedExtension *>::const_iterator it = m_loaded_extensions.begin(); it != m_loaded_extensions.end(); it++)
		if((*it)->file() == file)
			return;

	DynamicLibrary lib;

	if(lib.load(file) == false)
		throw ColdRubyException("ELF load failed", lib.errorString());

	int (*abi)() = (int (*)()) lib.resolve("coldruby_extension_abi");

	if(abi == NULL) 
		throw ColdRubyException("ELF load failed", lib.errorString());

	if(abi() != COLDRUBY_EXTENSION_ABI) {
		throw ColdRubyException("ELF load failed", "Extension ABI is not compatible");
	}

	ColdRubyExtension *(*create)(ColdRuby *) = (ColdRubyExtension *(*)(ColdRuby *)) lib.resolve("coldruby_extension_create");

	if(create == NULL) 
		throw ColdRubyException("ELF load failed", lib.errorString());

	ColdRubyExtension *extension = create(this);

	m_loaded_extensions.push_back(new LoadedExtension(file, lib, extension));
}

const ColdRuby::ext_type_t ColdRuby::m_ext_types[] = {
	{ "", "" },
	{ "", ".rb" },
	{ "lib", ".so" },
	{ NULL, NULL }
};

