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

/**
 * \file libcoldruby/StandardRubyCompiler.h
 * \brief Заголовочный файл класса \ref StandardRubyCompiler.
 */

#ifndef __STANDARD_RUBY_COMPILER__H__
#define __STANDARD_RUBY_COMPILER__H__

#include "RubyCompiler.h"

/** \brief Класс, включающий стандартные реализации некоторых функций для
 *         реализации компилятора Ruby.
 */

class StandardRubyCompiler: public RubyCompiler {
public:
	virtual bool boot(const std::string &code, const std::string &file, const std::string &epilogue) = 0;

	/** \brief Метод для загрузки кода компилятора из файла.
	 *
	 * Читает содержимое файла file, а затем вызывает метод boot для
	 * загрузки кода.
	 *
	 * \param file Файл, откуда следует загрузить код.
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */
	virtual bool boot(const std::string &file, const std::string &epilogue);

	virtual bool compile(const std::string &code, const std::string &file, std::string &js, const std::string &epilogue) = 0;

	/** \brief Метод для компиляции кода на Ruby из файла.
	 *
	 * Загружает код из файла file и вызывает compile для компиляции кода.
	 *
	 * \param file Файл, в котором находится код.
	 * \param js Ссылка на строку, куда будет помещен скомпилированный код.
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */
	virtual bool compile(const std::string &file, std::string &js, const std::string &epilogue);

	/** \brief Метод для получения описания ошибки.
	 *
	 * \return Строку, установленную последним вызовом \ref setErrorString.
	 */
	virtual const std::string &errorString() const;

protected:
	/** \brief Метод для установки описания ошибки.
	 *
	 * \param msg Описание ошибки, которое следует возвращать при
	 *            последующих вызовах \ref errorString.
	 */
	void setErrorString(const std::string &msg);

private:
	std::string m_errorString;
};

#endif
