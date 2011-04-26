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
LT_INIT([dlopen win32-dll])
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

MRI_LIBS="$RVAR_LIBRUBYARG $RVAR_SOLIBS"

MRI_CPPFLAGS="-I$RVAR_rubyhdrdir/$RVAR_sitearch"

for var in RVAR_vendorhdrdir RVAR_sitehdrdir RVAR_rubyhdrdir RVAR_includedir; do
	var=`eval echo \\\$\$var`
	if test "x$var" != "x"; then
		MRI_CPPFLAGS="$MRI_CPPFLAGS -I$var"
	fi
done

AC_MSG_RESULT([done])

AC_SUBST([MRI_CPPFLAGS])
AC_SUBST([MRI_LIBS])

dnl sanity checks

OLD_CPPFLAGS="$CPPFLAGS"
OLD_LIBS="$LIBS"

CPPFLAGS="$CPPFLAGS $MRI_CPPFLAGS"
LIBS="$LIBS $MRI_LIBS"

AC_CHECK_HEADER([ruby.h], [], [
	AC_MSG_ERROR([unable to find ruby])
])

AC_SEARCH_LIBS([ruby_init], [], [], [
	AC_MSG_ERROR([unable to find ruby])
])

CPPFLAGS="$OLD_CPPFLAGS"
LIBS="$OLD_LIBS"

AC_ARG_ENABLE([developer-mode], [AS_HELP_STRING([--enable-developer-mode], [use local coldruby compiler instead of system])],
	[compilerdir="$PWD/lib" runtimedir="$PWD/runtime" stdlibdir="$PWD/stdlib" DEVELOPER_MODE=1], [compilerdir="$datadir/coldruby" runtimedir="$datadir/coldruby/runtime" stdlibdir="$datadir/coldruby/stdlib" DEVELOPER_MODE=0])

AC_SUBST([DEVELOPER_MODE])
AM_CONDITIONAL([DEVELOPER_MODE], [test x$DEVELOPER_MODE = x1])

extensiondir=${libdir}/coldruby/${VERSION}

AC_SUBST([extensiondir])
AC_SUBST([compilerdir])
AC_SUBST([runtimedir])
AC_SUBST([stdlibdir])

AC_ARG_WITH([compiler],
	[AS_HELP_STRING([--with-compiler@<:@=PATH@:>@], [specify compiler root])]
, [compilerdir=$with_compiler]) 



AC_MSG_CHECKING([for compiler root])
AC_MSG_RESULT([$compilerdir])

AC_MSG_CHECKING([for runtime root])
AC_MSG_RESULT([$runtimedir])

DX_HTML_FEATURE(ON)
DX_CHM_FEATURE(OFF)
DX_CHI_FEATURE(OFF)
DX_MAN_FEATURE(OFF)
DX_RTF_FEATURE(OFF)
DX_XML_FEATURE(OFF)
DX_PDF_FEATURE(OFF)
DX_PS_FEATURE(OFF)
DX_INIT_DOXYGEN(coldruby, doxygen.cfg, doc)

AC_CHECK_HEADER([v8.h], [], [
	AC_MSG_ERROR([V8 not found])
])

V8_LIBS=

AC_CHECK_LIB([v8], [_ZN2v86Script3RunEv], [V8_LIBS=-lv8], [
	AC_MSG_ERROR([V8 not found])
])

AC_SUBST([V8_LIBS])

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
	libcoldruby/Makefile
	coldruby/Makefile
	lib/Makefile
	runtime/Makefile
	stdlib/Makefile
	ext/Makefile
	ext/kernel/Makefile
])
AC_OUTPUT