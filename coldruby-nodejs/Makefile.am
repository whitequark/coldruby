# ColdRuby -- V8-based Ruby implementation.
# Copyright (C) 2011  Sergey Gridassov <grindars@gmail.com>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 
extension_LTLIBRARIES = libcoldruby-nodejs.la
libcoldruby_nodejs_la_SOURCES = main.cpp ColdRubyNodeExtension.h ColdRubyNodeExtension.cpp \
	ThreadedMRIRubyCompiler.h ThreadedMRIRubyCompiler.cpp
libcoldruby_nodejs_la_LDFLAGS = -avoid-version ${PTHREAD_CFLAGS}
libcoldruby_nodejs_la_CFLAGS = ${PTHREAD_CFLAGS}
libcoldruby_nodejs_la_LIBADD = ${PTHREAD_LIBS} ../libcoldruby/libcoldruby.a \
	${MRI_LIBS} ${V8_LIBS}
libcoldruby_nodejs_la_CPPFLAGS = -I../libcoldruby ${MRI_CPPFLAGS} \
	-DCOMPILER_ROOT="\"$(compilerdir)\""

all-local:
	cp .libs/libcoldruby-nodejs.so coldruby.node

mostlyclean-local:
	rm -f coldruby.node
