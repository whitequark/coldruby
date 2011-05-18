#include <stdio.h>
#include <stdexcept>
#include <string.h>
#include <errno.h>

#include "ColdRubyNodeExtension.h"
#include "ThreadedMRIRubyCompiler.h"

ColdRubyNodeExtension::ColdRubyNodeExtension(v8::Handle<v8::Object> target): m_target(v8::Persistent<v8::Object>::New(target)) {
	m_target.MakeWeak(this, destroyExtension);

	printf("Creating extension!\n");

	m_compiler = new ThreadedMRIRubyCompiler;

	if(m_compiler->boot(std::string(COMPILER_ROOT "/coldruby/compile.rb"), std::string()) == false) {
		std::string error = "compiler boot failed: " + m_compiler->errorString();

		delete m_compiler;

		throw std::runtime_error(error.c_str());
	}
}

ColdRubyNodeExtension::~ColdRubyNodeExtension() {
	printf("Destroying extension!\n");

	delete m_compiler;
}

void ColdRubyNodeExtension::destroyExtension(v8::Persistent<v8::Value> object, void *arg) {
	delete static_cast<ColdRubyNodeExtension *>(arg);
}

