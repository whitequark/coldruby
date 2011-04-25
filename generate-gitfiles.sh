#!/bin/sh
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

set -e

top_srcdir="$1"
distdir="$2"


# check for git
which git >/dev/null 2>&1 || exit 0

if [ `wc -l "${distdir}/ChangeLog" | cut -d ' ' -f 1` -eq 0 ]; then
	echo "Generating ChangeLog"

	git log --date=iso8601 --format="%ad  %cN <%cE>%n%n%w(72,4)%B%n" > ${distdir}/ChangeLog
fi

if [ `wc -l "${distdir}/AUTHORS" | cut -d ' ' -f 1` -eq 0 ]; then
	echo "Generating AUTHORS"

	git log --format='%cN <%cE>' | sort -u > ${distdir}/AUTHORS
fi
