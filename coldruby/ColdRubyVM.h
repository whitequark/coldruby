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

#ifndef __COLDRUBY__VM__H__
#define __COLDRUBY__VM__H__

#include <v8.h>
#include <string>
#include "ColdRubyStackTrace.h"

class RubyCompiler;
class ColdRuby;

class ColdRubyVM {
public:
	enum DebugFlags {
		DumpRubyFrame = 0x01,
		DumpRubyStack = 0x02
	};
	
	ColdRubyVM();
	virtual ~ColdRubyVM();
	
	static int debugFlags();
	static void setDebugFlags(int flags);
	
	static void cleanup();

	bool initialize(RubyCompiler *compiler);
	RubyCompiler *compiler() const;
	
	ColdRuby *createRuby();
	
	const std::string &errorString();
	
private:
	friend class ColdRuby;
	
	bool runRubyJS(ColdRuby *ruby, const std::string &code, const std::string &file);
	bool evaluate(const std::string &file, v8::Handle<v8::Value> &ret);
	bool evaluate(const std::string &code, const std::string &file, 
		      v8::Handle<v8::Value> &ret);
	void formatException(v8::TryCatch *try_catch, ColdRuby *ruby = 0);
	bool unwindRubyStack(ColdRuby *ruby, std::string &trace);
	bool formatRubyException(v8::Handle<v8::Object> exception, ColdRuby *ruby, std::string &description);
	std::string exceptionArrow(v8::Handle<v8::Message> message);
	bool dumpObject(v8::Handle<v8::Value> val, std::ostringstream &info_stream, ColdRubyStackTrace &stackTrace,
			ColdRuby *ruby, int *frame_index, int flags, const std::string &variable_name);
	void buildRubyFrame(ColdRubyStackFrame &frame, v8::Handle<v8::Object> info, v8::Handle<v8::Object> iseq,
			    v8::Handle<v8::Object> sf, int frame_index);
	
	std::string m_errorString;
	v8::Persistent<v8::Context> m_context;
	bool m_initialized;
	RubyCompiler *m_compiler;
	static int m_debugFlags;


	enum DumpFlags {
		NewlineAfter = (1 << 0),
		LastVariable = (1 << 1),
		ObjectIsFrame = (1 << 2),
		RubyObject = (1 << 3),
		NotArray = (1 << 4),

		NewlinePrefix = (1 << 0),
		OutComma = (1 << 1),
		LineFeed = (1 << 2)
	};

	typedef struct {
		const char *variable;
		unsigned int flags;
	} frame_dump_variable_t;

	static const frame_dump_variable_t m_dump_variables[];
};

#endif
