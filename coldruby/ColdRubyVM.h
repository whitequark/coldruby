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

class RubyCompiler;
class ColdRuby;

class ColdRubyVM {
public:
	ColdRubyVM();
	virtual ~ColdRubyVM();
	
	bool initialize(RubyCompiler *compiler);
	
	ColdRuby *createRuby();
	
	bool runRuby(ColdRuby *ruby, const std::string &code, const std::string &file);
	bool runRuby(ColdRuby *ruby, const std::string &file);
	
	const std::string &errorString();
	
private:
	bool runRubyJS(ColdRuby *ruby, const std::string &code, const std::string &file);
	bool evaluate(const std::string &code, const std::string &file, 
		      v8::Handle<v8::Value> &ret);
	void formatException(v8::TryCatch *try_catch);
	
	std::string m_errorString;
	v8::Persistent<v8::Context> m_context;
	bool m_initialized;
	RubyCompiler *m_compiler;
};

#endif
