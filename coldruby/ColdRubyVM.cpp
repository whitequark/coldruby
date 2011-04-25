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

#include <stdio.h>
#include <sstream>
#include <iostream>
#include <RubyCompiler.h>
#include "ColdRubyVM.h"
#include "ColdRuby.h"

#define STD_STRING(s) ({v8::String::Utf8Value utf8_val(s); *utf8_val ? std::string(*utf8_val) : std::string(); })

ColdRubyVM::ColdRubyVM(): m_initialized(false) {
	m_context = v8::Context::New();
}

ColdRubyVM::~ColdRubyVM() {	
	m_context.Dispose();
}

bool ColdRubyVM::initialize(RubyCompiler *compiler) {
	if(m_initialized) {
		m_errorString = "Already initialized";
		
		return false;
	}
	
	v8::Context::Scope context_scope(m_context);
	
	v8::HandleScope handle_scope;
		
	v8::Handle<v8::Value> ret;
	
	const std::vector<ColdRubyRuntime> &runtime =
		compiler->runtime();
				
	for(std::vector<ColdRubyRuntime>::const_iterator it =
		runtime.begin(); it != runtime.end(); it++) {
		
		const ColdRubyRuntime &item = *it;
		
		if(evaluate(item.code(), item.file(), ret) == false)
			return false;
	}
	
	m_compiler = compiler;
	m_initialized = true;
	
	return true;
}

ColdRuby *ColdRubyVM::createRuby() {
	if(!m_initialized) {
		m_errorString = "Not initialized";
		
		return 0;
	}
	
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(m_context);
		
	v8::Handle<v8::Object> coldruby_object = v8::Handle<v8::Object>::Cast(
		m_context->Global()->Get(v8::String::New("$"))
	);
	
	v8::Handle<v8::Function> create_ruby = v8::Handle<v8::Function>::Cast(
		coldruby_object->Get(v8::String::New("create_ruby"))
	);
	
	if(create_ruby.IsEmpty()) {
		m_errorString = "$.create_ruby is not a function";
		
		return 0;
	}

	v8::TryCatch try_catch;

	v8::Handle<v8::Object> coldruby_obj = v8::Handle<v8::Object>::Cast(
		create_ruby->Call(coldruby_object, 0, 0)
	);

	if(try_catch.HasCaught()) {
		formatException(&try_catch);
		
		return false;
	}
	
	if(coldruby_obj.IsEmpty()) {
		m_errorString = "ColdRuby Object is not valid";
		
		return false;
	}
	
	return new ColdRuby(this, coldruby_obj);
}

bool ColdRubyVM::runRuby(ColdRuby *ruby, const std::string &code, const std::string &file) {
	std::string js;
	
	if(m_compiler->compile(code, file, js) == false) {
		m_errorString = m_compiler->errorString();
		
		return false;
	}
	
	return runRubyJS(ruby, js, file);
}

bool ColdRubyVM::runRuby(ColdRuby *ruby, const std::string &file) {
	std::string js;
	
	if(m_compiler->compile(file, js) == false) {
		m_errorString = m_compiler->errorString();
		
		return false;
	}
	
	return runRubyJS(ruby, js, file);
}

bool ColdRubyVM::runRubyJS(ColdRuby *ruby, const std::string &code, const std::string &file) {
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(m_context);
	v8::Handle<v8::Value> ret;
	
	if(evaluate(code, "<compiled>", ret) == false)
		return false;
	
	v8::Handle<v8::Function> func = v8::Handle<v8::Function>::Cast(ret);
	
	if(func.IsEmpty()) {
		m_errorString = "Compiled function is not valid";
		
		return false;
	}
			
	v8::TryCatch try_catch;
	
	v8::Handle<v8::Value> args[] = {
		ruby->ruby()
	};
		
	func->Call(m_context->Global(), 1, args);
		
	if(try_catch.HasCaught()) {
		formatException(&try_catch);
		
		return false;
	}
	
	return true;
}
	
bool ColdRubyVM::evaluate(const std::string &code, const std::string &file, v8::Handle<v8::Value> &ret) {
	v8::ScriptOrigin origin(v8::String::New(file.data(), file.length()));
		
	v8::TryCatch try_catch;
	
	v8::Handle<v8::Script> script = v8::Script::Compile(v8::String::New(code.data(), code.length()), &origin);
	
	if(script.IsEmpty()) {
		formatException(&try_catch);
		
		return false;
	}
	
	
	ret = script->Run();
	
	if(try_catch.HasCaught()) {
		formatException(&try_catch);
		
		return false;
	}
	
	return true;
}

const std::string &ColdRubyVM::errorString() {
	return m_errorString;
}

void ColdRubyVM::formatException(v8::TryCatch *try_catch) {
	v8::HandleScope handle_scope;

	std::string exception_string = STD_STRING(try_catch->Exception());
	
	v8::Handle<v8::Message> message = try_catch->Message();
		
	if(message.IsEmpty()) {
		m_errorString = exception_string;
	} else {
		std::ostringstream stream;
		
		stream << STD_STRING(message->GetScriptResourceName()) << ':';
		stream << message->GetLineNumber() << ": " << exception_string;
		stream << '\n';
		
		stream << STD_STRING(message->GetSourceLine()) << '\n';
	
		int start = message->GetStartColumn(), end = message->GetEndColumn();
		
		stream << std::string(start, '~') << std::string(end - start, '^');		
		
		std::string trace = STD_STRING(try_catch->StackTrace());
		
		if(trace.length() > 0)
			stream << '\n' << "Stack trace:\n" << trace;
		
		m_errorString = stream.str();
	}
	
}
