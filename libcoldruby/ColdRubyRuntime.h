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

/**
 * \file libcoldruby/ColdRubyRuntime.h
 * \brief Заголовочный файл класса \ref ColdRubyRuntime.
 */

#ifndef __COLDRUBY_RUNTIME__H__
#define __COLDRUBY_RUNTIME__H__

#include <string>

class ColdRubyRuntime {
public:
	ColdRubyRuntime(std::string code = std::string(), std::string file = std::string()) : m_code(code), m_file(file) {
		
	}

	inline const std::string &code() const { return m_code; }
	inline const std::string &file() const { return m_file; }

private:
	std::string m_code, m_file;
};

#endif
