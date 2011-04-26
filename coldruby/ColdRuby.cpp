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

std::vector<std::string> ColdRuby::searchPath() {
	std::vector<std::string> path;
	
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(m_vm->m_context);
	
	v8::Handle<v8::Function> gvar_get = v8::Handle<v8::Function>::Cast(
		m_ruby->Get(v8::String::New("gvar_get"))
	);
	
	if(gvar_get.IsEmpty())
		throw ColdRubyException("Internal error", "ruby.gvar_get is invalid");
	
	v8::Handle<v8::Function> check_convert_type = v8::Handle<v8::Function>::Cast(
		m_ruby->Get(v8::String::New("check_convert_type"))
	);
	
	if(check_convert_type.IsEmpty())
		throw ColdRubyException("Internal error", "ruby.check_convert_type is invalid");	
	
	v8::Handle<v8::Object> constants = v8::Handle<v8::Object>::Cast(
		m_ruby->Get(v8::String::New("c"))
	);
	
	if(constants.IsEmpty())
		throw ColdRubyException("Internal error", "ruby.c is invalid");

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
	
		pathArray = v8::Handle<v8::Array>::Cast(check_convert_type->Call(m_ruby, 3, argv));
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
	
	v8::Handle<v8::Function> gvar_set = v8::Handle<v8::Function>::Cast(
		m_ruby->Get(v8::String::New("gvar_set"))
	);
	
	if(gvar_set.IsEmpty())
		throw ColdRubyException("Internal error", "ruby.gvar_set is invalid");
	
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
