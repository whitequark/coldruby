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

#ifndef __MRI_RUBY_COMPILER__H__
#define __MRI_RUBY_COMPILER__H__

#include "StandardRubyCompiler.h"

#include <ruby.h>
#define RSTRING_STD(s) (TYPE(s) == T_STRING ? std::string(RSTRING_PTR(s), RSTRING_LENINT(s)) : std::string("<NOT A STRING>"))

class MRIRubyCompiler: public StandardRubyCompiler {
	typedef struct {
		MRIRubyCompiler *this_compiler;
		const std::string &code;
		const std::string &file;
		std::string &js;
		bool is_toplevel;
	} compile_data_t;	
	
public:
	static void sysinit(int *argc, char ***argv);
	
	virtual int initialize(post_init_t post_init, void *arg);
	virtual bool boot(const std::string &code, const std::string &file);
	virtual bool compile(const std::string &code, const std::string &file, std::string &js, bool is_toplevel = false);
	
	virtual const std::string &runtime() const;
private:
	static VALUE boot_protected_wrapper(VALUE arg);
	static VALUE compile_protected_wrapper(VALUE arg);
	
	void boot_protected(compile_data_t *data);
	void compile_protected(compile_data_t *data);
	
	void mri_exception();
	
	std::string m_runtime;
};

#endif