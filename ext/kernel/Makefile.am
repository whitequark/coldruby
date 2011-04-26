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
 
extension_LTLIBRARIES = libkernel.la
libkernel_la_SOURCES = KernelExtension.h KernelExtension.cpp
libkernel_la_LDFLAGS = -avoid-version
libkernel_la_CPPFLAGS = -DCOLDRUBY_EXTENSION -I../../libcoldruby

if DEVELOPER_MODE

all-local:
	@mkdir -p ../extensions
	cp $(addprefix .libs/,$(addsuffix .so,$(basename $(extension_LTLIBRARIES) .la))) ../extensions

endif

mostlyclean-local:
	rm -f $(addprefix ../extensions/,$(addsuffix .so,$(basename $(extension_LTLIBRARIES) .la)))