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

class ColdRubyVM;

class ColdRuby {
public:
	ColdRuby(ColdRubyVM *vm, v8::Handle<v8::Object> ruby);
	virtual ~ColdRuby();
	
	v8::Handle<v8::Object> ruby() const;
	
private:
	ColdRubyVM *m_vm;
	v8::Persistent<v8::Object> m_ruby;
};

#endif
