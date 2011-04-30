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

#include <sstream>
#include "ColdRubyStackTrace.h"

void ColdRubyStackTrace::parse(const std::string &trace) {
	std::istringstream stream(trace);

	clear();

	while(!stream.eof()) {
		std::string line;

		std::getline(stream, line);

		if(line.length() == 0)
			break;

		ColdRubyStackFrame frame;
		frame.parse(line);

		push_back(frame);
	}
}

std::string ColdRubyStackTrace::rebuild() {
	std::ostringstream stream;

	for(ColdRubyStackTrace::iterator it = begin(); it != end(); it++) {
		stream << (*it).rebuild() << "\n";
	}

	return stream.str();
}
