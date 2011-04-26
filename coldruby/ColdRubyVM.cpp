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
#include <errno.h>
#include <string.h>
#include <stdlib.h>
#include <limits.h>

#include "ColdRubyVM.h"
#include "ColdRuby.h"
#include "ColdRubyStackTrace.h"

#define STD_STRING(s) ({v8::String::Utf8Value utf8_val(s); *utf8_val ? std::string(*utf8_val) : std::string(); })

ColdRubyVM::ColdRubyVM(): m_initialized(false) {
	m_context = v8::Context::New();
}

ColdRubyVM::~ColdRubyVM() {	
	m_context.Dispose();
}

int ColdRubyVM::debugFlags() {
	return m_debugFlags;
}

void ColdRubyVM::setDebugFlags(int flags) {
	m_debugFlags = flags;
	
	std::string opts;
	
	if(m_debugFlags & DumpRubyFrame)
		opts = "--stack-trace-limit -1";
	else
		opts = "--stack-trace-limit 10";
	
	v8::V8::SetFlagsFromString(opts.data(), opts.length());	
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
		formatException(&try_catch, ruby);
		
		return false;
	}
	
	return true;
}
	
bool ColdRubyVM::evaluate(const std::string &file, v8::Handle<v8::Value> &ret) {
	FILE *source = fopen(file.c_str(), "rb");
	
	if(source == NULL) {
		m_errorString = strerror(errno);
		
		return false;
	}
	
	fseek(source, 0, SEEK_END);
	
	long size = ftell(source);
	
	rewind(source);
	
	char *content = new char[size];
	
	fread(content, 1, size, source);
	
	size_t bytes_read = 0;
	
	fclose(source);
	
	std::string line;
	line.assign(content, size);
	
	delete[] content;
	
	return evaluate(line, file, ret);
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

RubyCompiler *ColdRubyVM::compiler() const {
	return m_compiler;
}

std::string ColdRubyVM::exceptionArrow(v8::Handle<v8::Message> message) {
	int start = message->GetStartColumn(), end = message->GetEndColumn();
		
	return STD_STRING(message->GetSourceLine()) + '\n' +
		std::string(start, '~') + std::string(end - start, '^');
}

bool ColdRubyVM::formatRubyException(v8::Handle<v8::Object> exception, ColdRuby *ruby, std::string &description) {
	std::ostringstream stream;
	
	v8::HandleScope handle_scope;
	v8::TryCatch try_catch;
	
	v8::Handle<v8::Object> rbobj = ruby->ruby();	
	v8::Handle<v8::Function> funcall = v8::Handle<v8::Function>::Cast(
		rbobj->Get(v8::String::New("funcall"))
	);
	
	if(funcall.IsEmpty()) {
		m_errorString = "ruby.funcall is invalid";
		
		return false;
	}
	
	v8::Handle<v8::Object> constants = v8::Handle<v8::Object>::Cast(rbobj->Get(v8::String::New("c")));
		
	if(constants.IsEmpty()) {
		m_errorString = "ruby.c is invalid";
		
		return false;
	}
	
	{
		std::string exceptionClass;
	
		v8::Handle<v8::Value> klass = exception->Get(v8::String::New("klass"));
		
		v8::Handle<v8::Value> argv[] = { klass, v8::String::New("to_s") };
		
		exceptionClass = STD_STRING(
			funcall->Call(rbobj, 2, argv)->ToObject()->Get(v8::String::New("value"))
		);

		if(try_catch.HasCaught()) {
			formatException(&try_catch);
		
			return false;
		}
	
		stream << exceptionClass;
	}
	
	{
		std::string exceptionMsg;
			
		v8::Handle<v8::Value> argv[] = { exception, v8::String::New("to_s") };
		
		exceptionMsg = STD_STRING(
			funcall->Call(rbobj, 2, argv)->ToObject()->Get(v8::String::New("value"))
		);

		if(try_catch.HasCaught()) {
			formatException(&try_catch);
		
			return false;
		}
	
		stream << ": " << exceptionMsg;
	}
	
	v8::Handle<v8::Value> backtrace_ret;
	
	{
		v8::Handle<v8::Value> argv[] = { exception, v8::String::New("backtrace") };
		
		backtrace_ret = funcall->Call(rbobj, 2, argv);
		
		if(try_catch.HasCaught()) {
			formatException(&try_catch);
		
			return false;
		}
	}
	
	v8::Handle<v8::Array> backtrace;
	
	{
		v8::Handle<v8::Value> argv[] = {
			backtrace_ret,
			constants->Get(v8::String::New("Array")),
			v8::String::New("to_a")
		};
		
		v8::Handle<v8::Function> convert = v8::Handle<v8::Function>::Cast(
			rbobj->Get(v8::String::New("check_convert_type"))
		);
		
		if(convert.IsEmpty()) {
			m_errorString = "ruby.check_convert_type is invalid";
		
			return false;
		}
		
		backtrace = v8::Handle<v8::Array>::Cast(
			convert->Call(rbobj, 3, argv)
		);
		
		if(try_catch.HasCaught()) {
			formatException(&try_catch);
		
			return false;
		}
	}
	
	int count = backtrace->Length();
	
	for(int i = 0; i < count; i++)
		stream << "\n\tfrom " << STD_STRING(backtrace->Get(i));
	
	description = stream.str();
	
	return true;
}

void ColdRubyVM::formatException(v8::TryCatch *try_catch, ColdRuby *ruby) {
	v8::HandleScope handle_scope;

	v8::Handle<v8::Object> exception = v8::Handle<v8::Object>::Cast(try_catch->Exception());
	
	std::string exception_string = STD_STRING(exception);
	
	v8::Handle<v8::Message> message = try_catch->Message();
		
	std::ostringstream stream;
		
	if(message.IsEmpty()) {
		stream << exception_string;
	} else {
		if(ruby && !exception.IsEmpty() && exception->Has(v8::String::New("op"))) {		
			std::string op = STD_STRING(exception->Get(v8::String::New("op")));
			
			if(op == "raise") {				
				v8::Handle<v8::Object> obj =
					v8::Handle<v8::Object>::Cast(
						exception->Get(v8::String::New("object"))
					);
					
				std::string description;
					
				if(formatRubyException(obj, ruby, description) == false) {
					stream << "Attempt to format a Ruby exception failed.\n" << m_errorString;
				} else {
					stream << description;
				}
			} else {
				stream << "BUG: uncaught exception with op = '" << op << "'";
			}			
		} else {			
			stream << STD_STRING(message->GetScriptResourceName()) << ':';
			stream << message->GetLineNumber() << ": " << exception_string;
			stream << '\n';

			stream << exceptionArrow(message);

			std::string trace = STD_STRING(try_catch->StackTrace());
		
			if(trace.length() > 0) {
				stream << '\n' << "Stack trace:\n";
			
				trace = trace.substr(trace.find('\n') + 1) + "\n";
			
				if(ruby)
					unwindRubyStack(ruby, trace);
			
				stream << trace;
			}
		}
	}
	
	m_errorString = stream.str();
}

bool ColdRubyVM::dumpObject(v8::Handle<v8::Value> val, std::ostringstream &info_stream, ColdRubyStackTrace &stackTrace, 
			    int *frame_index, const std::string &variable_name) {
	if(val->IsNull() || val->IsUndefined()) {
		if(variable_name.length() == 0)
			info_stream << "null";
		else
			return false;
	} else {
		if(variable_name.length() > 0)
			info_stream << variable_name << ": ";
		
		if(val->IsArray()) {
			v8::Handle<v8::Array> array = v8::Handle<v8::Array>::Cast(val);
		
			info_stream << "[ ";
		
			bool is_first = true;
		
			int count = array->Length();
		
			for(int i = 0; i < count; i++) {
				if(is_first)
					is_first = false;
				else
					info_stream << ", ";
			
				dumpObject(array->Get(i), info_stream, stackTrace, frame_index, std::string());
			}
		
			info_stream << " ]";
		
		} else if(val->IsObject()) {
			bool frameFound = false;
		
			for(ColdRubyStackTrace::const_iterator it = stackTrace.begin(); it != stackTrace.end(); it++) {
				const ColdRubyStackFrame &frame = *it;
			
				if(frame.frameNumber() != INT_MIN) {
					if(val == frame.frame()) {
						frameFound = true;
					
						info_stream << "frame " << frame.frameNumber() << "";
					
						break;
					}
				}
			}
		
			if(!frameFound) {
				ColdRubyStackFrame frame;
			
				v8::Handle<v8::Object> iseq, info;
			
				iseq = v8::Handle<v8::Object>::Cast(val->ToObject()->Get(v8::String::New("iseq")));
				info = v8::Handle<v8::Object>::Cast(iseq->Get(v8::String::New("info")));
			
				buildRubyFrame(frame, info, iseq, val->ToObject(), --*frame_index);
			
				stackTrace.insert(stackTrace.end(), frame);
			
				info_stream << "frame " << *frame_index;
			}
		} else
			info_stream << "<unknown>";
	}
	
	return true;
}

void ColdRubyVM::buildRubyFrame(ColdRubyStackFrame &frame, v8::Handle<v8::Object> info, v8::Handle<v8::Object> iseq,
				v8::Handle<v8::Object> sf, int frame_index) {
	
	std::string file =     STD_STRING(info->Get(v8::String::New("file")));
	std::string function = STD_STRING(info->Get(v8::String::New("func")));
	int line;
								
	v8::Handle<v8::Value> val = sf->Get(v8::String::New("line"));

	if(val->IsUint32()) {
		line = val->Uint32Value();
	} else {
		line = info->Get(v8::String::New("line"))->Uint32Value();
	}
								
	frame.setFile(file);
	frame.setFunction(function);
	frame.setLine(line);
	frame.setColumn(0);
	frame.setFrameNumber(frame_index);
	frame.setFrame(sf);
}

bool ColdRubyVM::unwindRubyStack(ColdRuby *ruby, std::string &trace) {
	v8::Handle<v8::Object> context = v8::Handle<v8::Object>::Cast(
			ruby->ruby()->Get(v8::String::New("context"))
	);
					
	if(context.IsEmpty())
		return false;
	
	v8::Handle<v8::Object> sf = v8::Handle<v8::Object>::Cast(
		context->Get(v8::String::New("sf"))
	);
	
	if(sf.IsEmpty())
		return false;	
	
	ColdRubyStackTrace stackTrace;
	
	stackTrace.parse(trace);
	
	int frame_index = 0;
	
	for(ColdRubyStackTrace::const_iterator it = stackTrace.begin(); it != stackTrace.end(); it++) {
		if((*it).file() == "<compiled>")
			frame_index++;
	}
	
	for(ColdRubyStackTrace::iterator it = stackTrace.begin(); it != stackTrace.end(); it++) {
		ColdRubyStackFrame &frame = *it;
		
		if(frame.file() == "<compiled>") {			
			v8::Handle<v8::Object> iseq, info;						
	
			while(!sf.IsEmpty()) {
				iseq = v8::Handle<v8::Object>::Cast(sf->Get(v8::String::New("iseq")));
							
				if(iseq.IsEmpty())
					break;
								
				info = v8::Handle<v8::Object>::Cast(iseq->Get(v8::String::New("info")));
								
				if(!info.IsEmpty())
					break;
						
				sf = v8::Handle<v8::Object>::Cast(sf->Get(v8::String::New("parent")));
			}
							
			if(!sf.IsEmpty() && !iseq.IsEmpty() && !info.IsEmpty()) {
				buildRubyFrame(frame, info, iseq, sf, --frame_index);

				sf = v8::Handle<v8::Object>::Cast(sf->Get(v8::String::New("parent")));
			}
		}
	}
	
	if(m_debugFlags & DumpRubyFrame) {
		std::vector<v8::Handle<v8::String> > want_keys;
		want_keys.push_back(v8::Handle<v8::String>(v8::String::New("osf")));
		want_keys.push_back(v8::Handle<v8::String>(v8::String::New("outer")));
		want_keys.push_back(v8::Handle<v8::String>(v8::String::New("dynamic")));
		
		for(ColdRubyStackTrace::iterator it = stackTrace.begin(); it != stackTrace.end(); it++) {
			ColdRubyStackFrame &frame = *it;
			
			if(frame.frameNumber() != INT_MIN) {
				
				std::ostringstream info_stream;
				bool is_first = true;
							
				v8::Handle<v8::Object> sf = frame.frame();
				
				info_stream <<  "        ";
				
				for(std::vector<v8::Handle<v8::String> >::iterator key_it = want_keys.begin();
					key_it != want_keys.end(); key_it++) {
				
					if(!is_first)
						info_stream << ", ";
		
					v8::Handle<v8::Value> val = sf->Get(*key_it);					
					
					bool has_out = dumpObject(val, info_stream, stackTrace, &frame_index, STD_STRING(*key_it));
				
					if(is_first && has_out)
						is_first = false;
					else if(!has_out)
						is_first = true;
				}
				
				
				frame.setInfo(info_stream.str().c_str());
			}
			
		}
	}
	
	trace = stackTrace.rebuild();
	
	return true;

}

int ColdRubyVM::m_debugFlags = 0;
