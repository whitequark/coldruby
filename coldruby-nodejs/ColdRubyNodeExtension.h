#ifndef __COLDRUBYNODEEXTENSION__H__
#define __COLDRUBYNODEEXTENSION__H__

#include <v8.h>

class RubyCompiler;
class ColdRubyVM;

class ColdRubyNodeExtension {
public:
	ColdRubyNodeExtension(v8::Handle<v8::Object> target);
	~ColdRubyNodeExtension();

private:
	static void destroyExtension(v8::Persistent<v8::Value> object, void *arg);
	static v8::Handle<v8::Value> newRuby(const v8::Arguments &args);
	
	v8::Persistent<v8::Object> m_target;
	RubyCompiler *m_compiler;
	ColdRubyVM *m_vm;
};

#endif

