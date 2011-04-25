dnl ColdRuby -- V8-based Ruby implementation.
dnl Copyright (C) 2011  Sergey Gridassov <grindars@gmail.com>
dnl
dnl This program is free software; you can redistribute it and/or modify
dnl it under the terms of the GNU General Public License as published by
dnl the Free Software Foundation; either version 2 of the License, or
dnl (at your option) any later version.
dnl
dnl This program is distributed in the hope that it will be useful,
dnl but WITHOUT ANY WARRANTY; without even the implied warranty of
dnl MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
dnl GNU General Public License for more details.
dnl
dnl You should have received a copy of the GNU General Public License
dnl along with this program; if not, write to the Free Software
dnl Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

AC_PREREQ([2.62])
AC_INIT([coldruby], [0.1], [coldruby-dev@lists.whitequark.org])
AC_CONFIG_SRCDIR([coldruby/main.cpp])
AC_CONFIG_MACRO_DIR([m4])
AM_INIT_AUTOMAKE
AC_LANG([C++])
AC_PROG_CXX

AC_MSG_CHECKING([for ruby >= 1.9])

AC_PATH_PROGS_FEATURE_CHECK([RUBY], [ruby1.9.1 ruby], [
	ver=`$ac_path_RUBY --version | cut -d ' ' -f 2`

	AS_VERSION_COMPARE([$ver], [1.9], [:], [ac_cv_path_RUBY=$ac_path_RUBY ac_path_RUBY_found=:], \
		[ac_cv_path_RUBY=$ac_path_RUBY ac_path_RUBY_found=:])
], [AC_MSG_ERROR([unable to find ruby])])

AC_SUBST([RUBY], [$ac_cv_path_RUBY])

AC_MSG_RESULT([$RUBY])

AC_MSG_CHECKING([for ruby development files location])

$RUBY -r rbconfig -e "RbConfig::CONFIG.each { |k, v| print 'RVAR_', k, '=\"', v, \"\\\"\n\" }" > rconftest.sh && source $PWD/rconftest.sh 2>/dev/null

if test $? -ne 0; then
	rm -f rconftest.sh
	AC_MSG_RESULT([none])
	AC_MSG_ERROR([ruby failed])
fi

rm -f rconftest.sh

AC_DEFINE_UNQUOTED([RUBY_VERSION], ["$RVAR_ruby_version"], [Ruby version.])

LIBS="$LIBS $RVAR_LIBRUBYARG $RVAR_SOLIBS"
AC_SUBST([LIBS])

for var in RVAR_vendorhdrdir RVAR_sitehdrdir RVAR_rubyhdrdir RVAR_includedir; do
	var=`eval echo \\\$\$var`
	if test "x$var" != "x"; then
		CPPFLAGS="$CPPFLAGS -I$var"
		AC_SUBST([CPPFLAGS])
	fi
done

CPPFLAGS="$CPPFLAGS -I$RVAR_rubyhdrdir/$RVAR_sitearch"
AC_SUBST([CPPFLAGS])

AC_MSG_RESULT([done])

dnl sanity checks

AC_CHECK_HEADER([ruby.h], [], [
	AC_MSG_ERROR([unable to find ruby])
])

AC_SEARCH_LIBS([ruby_init], [], [], [
	AC_MSG_ERROR([unable to find ruby])
])

AC_ARG_ENABLE([developer-mode], [AS_HELP_STRING([--enable-developer-mode], [use local coldruby compiler instead of system])],
	[compilerdir="$PWD/lib" runtimedir="$PWD/runtime"], [compilerdir="$datadir/coldruby" runtimedir="$datadir/coldruby/runtime"])

AC_ARG_WITH([compiler],
	[AS_HELP_STRING([--with-compiler@<:@=PATH@:>@], [specify compiler root])]
, [compilerdir=$with_compiler]) 

AC_SUBST([compilerdir])
AC_SUBST([runtimedir])

AC_MSG_CHECKING([for compiler root])
AC_MSG_RESULT([$compilerdir])

AC_MSG_CHECKING([for runtime root])
AC_MSG_RESULT([$runtimedir])

AH_TOP(
[/*
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
])

AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([
	Makefile
	coldruby/Makefile
	lib/Makefile
	runtime/Makefile
])
AC_OUTPUT