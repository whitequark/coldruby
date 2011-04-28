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

#ifndef __COLDRUBY__H__
#define __COLDRUBY__H__

#include <v8.h>
#include <vector>
#include <string>

class ColdRubyVM;

class ColdRuby {
public:
	ColdRuby(ColdRubyVM *vm, v8::Handle<v8::Object> ruby);
	virtual ~ColdRuby();
	
	v8::Handle<v8::Object> ruby() const;
	
	std::vector<std::string> searchPath();
	void setSearchPath(std::vector<std::string> path);
	
	void run(const std::string &code, const std::string &file);
	void run(const std::string &file);
	
	const std::string &errorString() const;
	
	v8::Handle<v8::Function> pullFunction(const char *name);
	v8::Handle<v8::Object> pullObject(const char *name);

private:
	void setErrorString(const std::string &string);
	
	ColdRubyVM *m_vm;
	v8::Persistent<v8::Object> m_ruby;
	
	std::string m_errorString;
};

#endif
