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

#ifndef __COLD_RUBY_EXTENSION__H__
#define __COLD_RUBY_EXTENSION__H__

#define COLDRUBY_EXTENSION_ABI	1

#if defined(_WIN32)
	#if defined(COLDRUBY_EXTENSION)
		#define COLDRUBY_EXT_DLLSPEC __declspec(dllexport)
	#else
		#define COLDRUBY_EXT_DLLSPEC __declspec(dllimport)
	#endif
#else
	#define COLDRUBY_EXT_DLLSPEC
#endif

#define COLDRUBY_EXPORT_EXTENSION(cl) \
	ColdRubyExtension * COLDRUBY_EXT_DLLSPEC coldruby_extension_create(ColdRuby *ruby) { \
		return new cl(ruby); \
	} \
	int COLDRUBY_EXT_DLLSPEC coldruby_extension_abi() { \
		return COLDRUBY_EXTENSION_ABI; \
	}
	
class ColdRuby;

class ColdRubyExtension {
public:
	virtual ~ColdRubyExtension();
};

#if defined(__cplusplus)
extern "C" {
#endif

ColdRubyExtension * COLDRUBY_EXT_DLLSPEC coldruby_extension_create(ColdRuby *ruby);
int COLDRUBY_EXT_DLLSPEC coldruby_extension_abi();

typedef ColdRubyExtension (*coldruby_extension_create_t)(ColdRuby *ruby);
typedef int (*coldruby_extension_abi_t)();

#if defined(__cplusplus)
}
#endif

#endif
