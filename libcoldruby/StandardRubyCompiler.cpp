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

#include <string.h>
#include <stdio.h>
#include <errno.h>
#include "StandardRubyCompiler.h"

using namespace coldruby;

bool StandardRubyCompiler::boot(const std::string &file, const std::string &epilogue) {
	FILE *source = fopen(file.c_str(), "rb");

	if(source == NULL) {
		setErrorString(strerror(errno));

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

	return boot(line, file, epilogue);
}

bool StandardRubyCompiler::compile(const std::string &file, std::string &js, const std::string &epilogue) {
	FILE *source = fopen(file.c_str(), "rb");

	if(source == NULL) {
		setErrorString(strerror(errno));

		return false;
	}

	fseek(source, 0, SEEK_END);

	long size = ftell(source);

	rewind(source);

	char *content = new char[size + 1];
	content[size] = 0;

	fread(content, 1, size, source);

	fclose(source);

	std::string line(content, size);

	delete[] content;

	return compile(content, file, js, epilogue);
}

const std::string &StandardRubyCompiler::errorString() const {
	return m_errorString;
}

void StandardRubyCompiler::setErrorString(const std::string &msg) {
	m_errorString = msg;
}
