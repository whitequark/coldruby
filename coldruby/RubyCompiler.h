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

#ifndef __RUBY_COMPILER__H__
#define __RUBY_COMPILER__H__

#include <string>

class RubyCompiler {
public:
	typedef int (*post_init_t)(RubyCompiler *compiler, void *arg);

	RubyCompiler() {}
	virtual ~RubyCompiler() {}

	virtual int initialize(post_init_t post_init, void *arg) = 0;

	virtual bool boot(const std::string &code, const std::string &file) = 0;
	virtual bool boot(const std::string &file) = 0;

	virtual bool compile(const std::string &code, const std::string &file, std::string &js, bool is_toplevel = false) = 0;
	virtual bool compile(const std::string &file, std::string &js, bool is_toplevel = false) = 0;

	virtual const std::string &errorString() const = 0;
	
	virtual const std::string &runtime() const = 0;
};

#endif
