#include <stdio.h>
#include <stdexcept>
#include <string.h>
#include <errno.h>

#include <ColdRubyVM.h>
#include <ColdRuby.h>

#include "ColdRubyNodeExtension.h"
#include "ThreadedMRIRubyCompiler.h"

ColdRubyNodeExtension::ColdRubyNodeExtension(v8::Handle<v8::Object> target): m_target(v8::Persistent<v8::Object>::New(target)) {
	m_target.MakeWeak(this, destroyExtension);

	m_compiler = new ThreadedMRIRubyCompiler;

	if(m_compiler->boot(std::string(COMPILER_ROOT "/coldruby/compile.rb"), std::string()) == false) {
		std::string error = "compiler boot failed: " + m_compiler->errorString();

		delete m_compiler;

		throw std::runtime_error(error.c_str());
	}

	m_vm = new coldruby::ColdRubyVM(v8::Context::GetCurrent());
	
	if(m_vm->initialize(m_compiler) == false) {
		std::string error = "VM initialization failed: " + m_vm->errorString();
		
		delete m_vm;
		delete m_compiler;
	}
	
	v8::Handle<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(
		newRuby, v8::External::Wrap(this));
		
	target->Set(v8::String::New("new_ruby"), tpl->GetFunction());
}

ColdRubyNodeExtension::~ColdRubyNodeExtension() {
	delete m_vm;
	delete m_compiler;
}

void ColdRubyNodeExtension::destroyExtension(v8::Persistent<v8::Value> object, void *arg) {
	delete static_cast<ColdRubyNodeExtension *>(arg);
}

v8::Handle<v8::Value> ColdRubyNodeExtension::newRuby(const v8::Arguments &args) {
	ColdRubyNodeExtension *self = static_cast<ColdRubyNodeExtension *>
		(v8::External::Unwrap(args.Data()));
		
	coldruby::ColdRuby *ruby = self->m_vm->createRuby();
	
	if(ruby == NULL) {
		v8::ThrowException(v8::Exception::Error(v8::String::New(
			ruby->errorString().c_str()
		)));
		
		return v8::Null();
	}
	
	ruby->delegateToJS();
	
	return ruby->ruby();
}
