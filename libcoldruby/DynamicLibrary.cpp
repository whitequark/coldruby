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

#include <dlfcn.h>
#include <stdio.h>

#include "DynamicLibrary.h"

using namespace coldruby;

DynamicLibraryPrivate::DynamicLibraryPrivate() : m_hndl(0), m_refs(1) {

}

DynamicLibraryPrivate::~DynamicLibraryPrivate() {
	unload();
}

bool DynamicLibraryPrivate::load(const std::string &filename) {
	if(m_hndl)
		unload();

	m_hndl = dlopen(filename.c_str(), RTLD_LAZY);

	if(m_hndl == NULL) {
		m_errorString = dlerror();

		return false;
	}

	return true;
}

void DynamicLibraryPrivate::unload() {
	if(m_hndl != NULL) {
		dlclose(m_hndl);

		m_hndl = NULL;
	}
}

void *DynamicLibraryPrivate::resolve(const char *symbol) {
	void *ret = dlsym(m_hndl, symbol);

	if(ret == NULL)
		m_errorString = dlerror();

	return ret;
}

std::string DynamicLibraryPrivate::errorString() const {
	return m_errorString;
}

void DynamicLibraryPrivate::addReference() {
	m_refs++;
}

bool DynamicLibraryPrivate::removeReference() {
	return --m_refs <= 0;
}

DynamicLibrary::DynamicLibrary() : m_data(new DynamicLibraryPrivate) {

}

DynamicLibrary::DynamicLibrary(const DynamicLibrary &original) : m_data(original.m_data) {
	m_data->addReference();
}

DynamicLibrary::~DynamicLibrary() {
	if(m_data->removeReference())
		delete m_data;
}

bool DynamicLibrary::load(const std::string &filename) {
	return m_data->load(filename);
}

void DynamicLibrary::unload() {
	m_data->unload();
}

void *DynamicLibrary::resolve(const char *symbol) {
	return m_data->resolve(symbol);
}

std::string DynamicLibrary::errorString() const {
	return m_data->errorString();
}

DynamicLibrary &DynamicLibrary::operator=(const DynamicLibrary &b) {
	if(m_data->removeReference())
		delete m_data;

	m_data = b.m_data;
	m_data->addReference();

	return *this;
}


