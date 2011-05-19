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

	void delegateToJS();

	std::string resolve(const std::string &file);
	
	v8::Handle<v8::Object> ruby() const;

	std::vector<std::string> searchPath();
	void setSearchPath(std::vector<std::string> path);

	void run(const std::string &code, const std::string &file);
	void run(const std::string &file);

	const std::string &errorString() const;

	v8::Handle<v8::Function> pullFunction(const char *name);
	v8::Handle<v8::Object> pullObject(const char *name);

	bool gvar_defined(v8::Handle<v8::String> name);
	void gvar_alias(v8::Handle<v8::String> name, v8::Handle<v8::String> other);
	v8::Local<v8::Value> gvar_get(v8::Handle<v8::String> name);
	void gvar_set(v8::Handle<v8::String> name, v8::Handle<v8::Value> value);

	bool const_defined(v8::Handle<v8::Value> scope, v8::Handle<v8::String> name,
		bool inherit = false);
	v8::Local<v8::Value> const_get(v8::Handle<v8::Value> scope, v8::Handle<v8::String> name,
		bool inherit = false);
	void const_set(v8::Handle<v8::Value> scope, v8::Handle<v8::String> name,
		v8::Handle<v8::Value> value);

	bool cvar_defined(v8::Handle<v8::Value> scope, v8::Handle<v8::String> name);
	v8::Local<v8::Value> cvar_get(v8::Handle<v8::Value> scope,
		v8::Handle<v8::String> name);
	void cvar_set(v8::Handle<v8::Value> scope, v8::Handle<v8::String> name,
		v8::Handle<v8::Value> value);
	v8::Local<v8::Value> cvar_remove(v8::Handle<v8::Value> scope,
		v8::Handle<v8::String> name);

	v8::Local<v8::Object> define_module(v8::Handle<v8::String> name);
	v8::Local<v8::Object> define_class(v8::Handle<v8::String> name, v8::Handle<v8::Object> super);
	v8::Local<v8::Object> get_singleton(v8::Handle<v8::Object> object);
	void module_include(v8::Handle<v8::Object> target, v8::Handle<v8::Object> module);
	void define_method(v8::Handle<v8::Object> klass, v8::Handle<v8::String> name,
		int want_args, v8::Handle<v8::Function> closure);
	void define_singleton_method(v8::Handle<v8::Object> klass, v8::Handle<v8::String> name,
		int want_args, v8::Handle<v8::Function> closure);
	void alias_method(v8::Handle<v8::Object> klass, v8::Handle<v8::String> name,
		v8::Handle<v8::String> other_name);
	void attr(v8::Handle<v8::String> type, v8::Handle<v8::Object> klass,
		v8::Handle<v8::String> method);
	void attr(v8::Handle<v8::String> type, v8::Handle<v8::Object> klass,
		v8::Handle<v8::Array> methods);

	bool test(v8::Handle<v8::Object> object);
	bool respond_to(v8::Handle<v8::Object> object, v8::Handle<v8::String> method);
	bool obj_is_kind_of(v8::Handle<v8::Object> object, v8::Handle<v8::Object> klass);
	v8::Local<v8::String> obj_classname(v8::Handle<v8::Object> object);
	void check_args(v8::Handle<v8::Array> arguments, int required, int optional = 0);
	void check_type(v8::Handle<v8::Object> arg, v8::Handle<v8::Object> type);
	void check_type(v8::Handle<v8::Object> arg, v8::Handle<v8::Array> types);
	void check_convert_type(v8::Handle<v8::Object> arg, v8::Handle<v8::Object> type,
			v8::Handle<v8::String> converter);

	void raise(v8::Handle<v8::Object> templ, v8::Handle<v8::String> message,
		v8::Handle<v8::Value> backtrace = v8::Null(), int skip = 0);
	void raise2(v8::Handle<v8::Object> templ, v8::Handle<v8::Array> arguments,
		v8::Handle<v8::Value> backtrace = v8::Null(), int skip = 0);
	void raise3(v8::Handle<v8::Object> exception);

	v8::Local<v8::Object> funcall2(v8::Handle<v8::Object> receiver, v8::Handle<v8::String> method,
		v8::Handle<v8::Array> arguments, v8::Handle<v8::Value> block, bool vcall);
	v8::Local<v8::Object> super2(v8::Handle<v8::Array> arguments, v8::Handle<v8::Value> block);
	v8::Local<v8::Object> super3();
	bool block_given_p();
	v8::Local<v8::Object> block_proc();
	v8::Local<v8::Object> block_lambda();
	v8::Local<v8::Object> lambda(v8::Handle<v8::Function> closure, int want_args);
	v8::Local<v8::Object> yield2(v8::Handle<v8::Array> arguments);

	int to_int(v8::Handle<v8::Object> value);
	v8::Local<v8::String> to_str(v8::Handle<v8::Object> value);
	v8::Local<v8::Array> to_ary(v8::Handle<v8::Object> value);
	v8::Local<v8::Object> to_sym(v8::Handle<v8::Object> value);
	v8::Local<v8::Object> to_float(v8::Handle<v8::Object> value);
	v8::Local<v8::Object> to_block(v8::Handle<v8::Object> value);

	v8::Local<v8::Object> string_new(v8::Handle<v8::String> value);

private:
	static void rubyDisposed(v8::Persistent<v8::Value> object, void *arg);

	void setErrorString(const std::string &string);

	ColdRubyVM *m_vm;
	v8::Persistent<v8::Object> m_ruby;

	std::string m_errorString;
};

#endif
