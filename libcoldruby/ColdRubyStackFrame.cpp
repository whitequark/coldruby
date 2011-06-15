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
#include <stdlib.h>
#include <sstream>
#include <limits.h>
#include "ColdRubyStackFrame.h"

using namespace coldruby;

ColdRubyStackFrame::ColdRubyStackFrame() : m_line(0), m_column(0), m_frameNumber(INT_MIN) {

}

const std::string &ColdRubyStackFrame::file() const {
	return m_file;
}

void ColdRubyStackFrame::setFile(const std::string &file) {
	m_file = file;
}

const std::string &ColdRubyStackFrame::function() const {
	return m_function;
}

void ColdRubyStackFrame::setFunction(const std::string &function) {
	m_function = function;
}

const std::string &ColdRubyStackFrame::info() const {
	return m_info;
}

void ColdRubyStackFrame::setInfo(const std::string &info) {
	m_info = info;
}


int ColdRubyStackFrame::line() const {
	return m_line;
}

void ColdRubyStackFrame::setLine(int line) {
	m_line = line;
}

int ColdRubyStackFrame::column() const {
	return m_column;
}

void ColdRubyStackFrame::setColumn(int column) {
	m_column = column;
}

int ColdRubyStackFrame::frameNumber() const {
	return m_frameNumber;
}

void ColdRubyStackFrame::setFrameNumber(int number) {
	m_frameNumber = number;
}

v8::Handle<v8::Object> ColdRubyStackFrame::frame() const {
	return m_frame;
}

void ColdRubyStackFrame::setFrame(v8::Handle<v8::Object> frame) {
	m_frame = frame;
}

void ColdRubyStackFrame::parse(const std::string &trace_line) {
	std::string line = trace_line.substr(7);

	int sep = line.find(' ');
	std::string location;

	if(sep == -1) {
		location = line;
		m_function.clear();
	} else {
		location = line.substr(sep + 2, line.length() - sep - 3);
		m_function = line.substr(0, sep);
	}


	int sep_1 = location.find(':'), sep_2 = location.rfind(':');

	m_file = location.substr(0, sep_1);
	m_line = atoi(location.substr(sep_1 + 1, sep_2 - sep_1 - 1).c_str());
	m_column = atoi(location.substr(sep_2 + 1).c_str());
}

std::string ColdRubyStackFrame::rebuild() {
	std::ostringstream stream;

	stream << "   ";

	if(m_frameNumber != INT_MIN)
		stream << "frame " << m_frameNumber << " ";
	else
		stream << "native  ";

	stream << "at ";

	if(m_function.length() > 0) {
		stream << m_function << " (" << m_file << ':' << m_line;

		if(m_column)
			stream << ':' << m_column;

		stream << ')';
	} else {
		stream << m_file << ':' << m_line;

		if(m_column)
			stream << ':' << m_column;
	}

	if(m_info.length() > 0) {
		stream << " {\n" << m_info << "\n   }";
	}

	return stream.str();
}
