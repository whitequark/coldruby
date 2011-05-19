#include <exception>

#include "ColdRubyNodeExtension.h"

extern "C" void init(v8::Handle<v8::Object> target) {
	try {
		new ColdRubyNodeExtension(target);
	} catch(const std::exception &e) {
		v8::ThrowException(v8::Exception::Error(v8::String::New(e.what())));
	}
}

