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

#ifndef __DYNAMIC_LIBRARY__H__
#define __DYNAMIC_LIBRARY__H__

#include <string>

class DynamicLibraryPrivate {
public:
	DynamicLibraryPrivate();
	~DynamicLibraryPrivate();

	bool load(const std::string &filename);
	void unload();
	void *resolve(const char *symbol);

	std::string errorString() const;

	void addReference();
	bool removeReference();

private:
	void *m_hndl;
	std::string m_errorString;
	int m_refs;
};

class DynamicLibrary {
public:
	DynamicLibrary();
	DynamicLibrary(const DynamicLibrary &original);

	~DynamicLibrary();

	bool load(const std::string &filename);
	void unload();
	void *resolve(const char *symbol);

	std::string errorString() const;

	DynamicLibrary &operator=(const DynamicLibrary &b);

private:
	DynamicLibraryPrivate *m_data;
};


#endif

