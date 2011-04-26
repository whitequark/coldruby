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

#ifndef __COLDRUBY_STACK_FRAME__H__
#define __COLDRUBY_STACK_FRAME__H__

#include <string>
#include <v8.h>

class ColdRubyStackFrame {
public:
	ColdRubyStackFrame();

	void parse(const std::string &line);
	std::string rebuild();
	
	const std::string &file() const;
	void setFile(const std::string &file);
	
	const std::string &function() const;
	void setFunction(const std::string &function);
	
	const std::string &info() const;
	void setInfo(const std::string &info);
	
	int line() const;
	void setLine(int line);
	
	int column() const;
	void setColumn(int column);
	
	int frameNumber() const;
	void setFrameNumber(int number);
	
	v8::Handle<v8::Object> frame() const;
	void setFrame(v8::Handle<v8::Object> frame);
	
private:
	std::string m_file, m_function, m_info;
	int m_line, m_column, m_frameNumber;
	v8::Handle<v8::Object> m_frame;
};

#endif
