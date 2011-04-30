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

#include "ColdRuby.h"
#include "ColdRubyVM.h"
#include "ColdRubyException.h"
#include "RubyCompiler.h"

ColdRuby::ColdRuby(ColdRubyVM *vm, v8::Handle<v8::Object> ruby) : m_vm(vm), m_ruby(v8::Persistent<v8::Object>::New(ruby)) {

}

ColdRuby::~ColdRuby() {
	m_ruby.Dispose();
}

v8::Handle<v8::Object> ColdRuby::ruby() const {
	return m_ruby;
}

void ColdRuby::run(const std::string &code, const std::string &file) {
	std::string js;

	RubyCompiler *compiler = m_vm->compiler();

	if(compiler->compile(code, file, js) == false)
		throw ColdRubyException("Compilation failed", compiler->errorString());

	if(m_vm->runRubyJS(this, js, file) == false)
		throw ColdRubyException(m_vm->errorString());
}

void ColdRuby::run(const std::string &file) {
	std::string js;

	RubyCompiler *compiler = m_vm->compiler();

	if(compiler->compile(file, js) == false)
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

v8::Handle<v8::Function> ColdRuby::pullFunction(const char *name) {
	v8::Handle<v8::Value> ref = m_ruby->Get(v8::String::New(name));

	if(!ref->IsFunction())
		throw ColdRubyException("Internal error", "ruby." + std::string(name) + " is invalid");

	return v8::Handle<v8::Function>::Cast(ref);
}

v8::Handle<v8::Object> ColdRuby::pullObject(const char *name) {
	v8::Handle<v8::Value> ref = m_ruby->Get(v8::String::New(name));

	if(!ref->IsObject())
		throw ColdRubyException("Internal error", "ruby." + std::string(name) + " is invalid");

	return ref->ToObject();
}

std::vector<std::string> ColdRuby::searchPath() {
	std::vector<std::string> path;

	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(m_vm->m_context);

	v8::Handle<v8::Function> gvar_get = pullFunction("gvar_get");
	v8::Handle<v8::Function> check_convert_type = pullFunction("check_convert_type");
	v8::Handle<v8::Object> constants = pullObject("c");

	v8::Handle<v8::Value> gvar;
	v8::TryCatch try_catch;

	{
		v8::Handle<v8::Value> argv[] = {
			v8::String::New("$:")
		};

		gvar = gvar_get->Call(m_ruby, 1, argv);
	}

	if(try_catch.HasCaught()) {
		m_vm->formatException(&try_catch, this);

		throw ColdRubyException(m_vm->errorString());
	}

	v8::Handle<v8::Array> pathArray;

	{
		v8::Handle<v8::Value> argv[] = {
			gvar,
			constants->Get(v8::String::New("Array")),
			v8::String::New("to_a")
		};

		v8::Handle<v8::Value> ref = check_convert_type->Call(m_ruby, 3, argv);

		if(!ref->IsArray())
			throw ColdRubyException("Internal error", "to_a returned something other than array");

		pathArray = v8::Handle<v8::Array>::Cast(ref);
	}

	if(try_catch.HasCaught()) {
		m_vm->formatException(&try_catch, this);

		throw ColdRubyException(m_vm->errorString());
	}

	int len = pathArray->Length();

	path.resize(len);

	for(int i = 0; i < len; i++) {
		std::string item;

		v8::String::Utf8Value str(pathArray->Get(i));

		if(str.length() > 0) {
			item.assign(*str, str.length());
		}

		path[i] = item;
	}

	return path;
}

void ColdRuby::setSearchPath(std::vector<std::string> path) {
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(m_vm->m_context);

	int count = path.size();

	v8::Handle<v8::Array> pathArray = v8::Array::New();

	for(int i = 0; i < count; i++) {
		std::string item = path.at(i);

		pathArray->Set(i, v8::String::New(item.data(), item.length()));
	}

	v8::Handle<v8::Function> gvar_set = pullFunction("gvar_set");

	v8::Handle<v8::Value> argv[] = {
		v8::String::New("$:"),
		pathArray
	};

	v8::TryCatch try_catch;

	gvar_set->Call(m_ruby, 2, argv);

	if(try_catch.HasCaught()) {
		m_vm->formatException(&try_catch, this);

		throw ColdRubyException(m_vm->errorString());
	}
}

#define DO_RUBY_CALL(func, argc, ...) \
	v8::HandleScope handle_scope; \
	v8::Context::Scope context_scope(m_vm->m_context); \
	v8::Handle<v8::Function> func = pullFunction(#func); \
	v8::TryCatch try_catch; \
	v8::Handle<v8::Value> args[] = { __VA_ARGS__ }; \
	v8::Handle<v8::Value> ret = func->Call(m_ruby, argc, args); \
	if(try_catch.HasCaught()) { \
		m_vm->formatException(&try_catch, this); \
		throw ColdRubyException(m_vm->errorString()); \
	}

v8::Local<v8::Boolean> ColdRuby::gvar_defined(v8::Handle<v8::String> name) {
	DO_RUBY_CALL(gvar_defined, 1, name);

	if(!ret->IsBoolean())
		throw ColdRubyException("Internal error", "gvar_defined returned something other than boolean");

	return ret->ToBoolean();
}


void ColdRuby::gvar_alias(v8::Handle<v8::String> name, v8::Handle<v8::String> other) {
	DO_RUBY_CALL(gvar_alias, 2, name, other)
}

v8::Local<v8::Value> ColdRuby::gvar_get(v8::Handle<v8::String> name) {
	DO_RUBY_CALL(gvar_get, 1, name);

	return v8::Local<v8::Value>::New(ret);
}

void ColdRuby::gvar_set(v8::Handle<v8::String> name, v8::Handle<v8::Value> value) {
	DO_RUBY_CALL(gvar_set, 2, name, value);
}

