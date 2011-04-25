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
 * \file libcoldruby/RubyCompiler.h
 * \brief Заголовочный файл интерфейса \ref RubyCompiler.
 */

#ifndef __RUBY_COMPILER__H__
#define __RUBY_COMPILER__H__

#include <string>

/** \brief Интерфейс для компиляторов кода Ruby в JavaScript.
 *
 * Используется виртуальной машиной ColdRuby при загрузке файлов исходного
 * кода и функцией eval().
 *
 * Не обязан быть безопасным для использования в многопоточной среде:
 * используется только из одного потока.
 *
 * В один момент времени существует только один инстанс RubyCompiler.
 */

class RubyCompiler {
public:
	/** \brief Тип указателя на функцию для \ref initialize.
	 *
	 * Вызывается \ref initialize после инициализации стека и
	 * интерпретатора.
	 *
	 * \param compiler Инстанс компилятора.
	 * \param arg Параметр, переданный \ref initialize.
	 * \return Код возврата для \ref initialize.
	 */
	typedef int (*post_init_t)(RubyCompiler *compiler, void *arg);

	/** \brief Пустой конструктор класса. */
	RubyCompiler() {}
	
	/** \brief Пустой виртуальный деструктор класса. */
	virtual ~RubyCompiler() {}

	/** \brief Метод для инициализации стека.
	 *
	 * Инициализирует стек и интерпретатор, и затем вызывает функцию,
	 * переданную в аргументе post_init.
	 *
	 * Реализации интерфейса могут накладывать дополнительные ограничения
	 * на условия вызова этого метода.
	 *
	 * \param post_init Функция, которая будет вызвана после инициализации.
	 * \param arg Аргумент для функции.
	 * \return Значение, возвращенное post_init.
	 */
	virtual int initialize(post_init_t post_init, void *arg) = 0;

	/** \brief Метод для загрузки кода компилятора.
	 *
	 * Выполняет действие, аналогичное eval(code, nil, file, 1) в Ruby.
	 *
	 * Также может выполнять другие действия, связанные с инициализацией.
	 *
	 * Должен быть вызван внутри функции, переданной initialize, и только
	 * один раз.
	 *
	 * \param code Код для загрузки.
	 * \param file Файл, откуда был загружен код (передается в переменную __FILE__).
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */
	virtual bool boot(const std::string &code, const std::string &file) = 0;
	
	/** \brief Метод для загрузки кода компилятора из файла.
	 *
	 * Выполняет действие, аналогичное load(file) Ruby, но без поиска файла
	 * в стандартных каталогах.
	 *
	 * Также может выполнять другие действия, связанные с инициализацией.
	 *
	 * Должен быть вызван внутри функции, переданной initialize, и только
	 * один раз.
	 *
	 * \param file Файл, откуда следует загрузить код.
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */
	virtual bool boot(const std::string &file) = 0;

	/** \brief Метод для компиляции кода на Ruby.
	 *
	 * Компилирует код, находящийся в переменной code, в JavaScript и помещает его в переменную js.
	 *
	 * \param code Код на Ruby, который следует откомпилировать.
	 * \param file Файл, откуда был загружен код (передается в переменную __FILE__).
	 * \param js Ссылка на строку, куда будет помещен скомпилированный код.
	 * \param is_toplevel Флаг, включающий режим кода верхнего уровня в
	 *                    компиляторе (см. compile.rb).
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */
	virtual bool compile(const std::string &code, const std::string &file, std::string &js, bool is_toplevel = false) = 0;
	
	/** \brief Метод для компиляции кода на Ruby из файла.
	 *
	 * Компилирует код, находящий в файле file, в JavaScript и помещает его в переменную js.
	 *
	 * \param file Файл, в котором находится код.
	 * \param js Ссылка на строку, куда будет помещен скомпилированный код.
	 * \param is_toplevel Флаг, включающий режим кода верхнего уровня в
	 *                    компиляторе (см. compile.rb).
	 * \return true в случае успеха, false и сообщение об ошибке в \ref errorString в случае ошибки.
	 */	
	virtual bool compile(const std::string &file, std::string &js, bool is_toplevel = false) = 0;

	/** \brief Метод для получения описания ошибки.
	 *
	 * \return Строку с описанием последней ошибки.
	 */
	virtual const std::string &errorString() const = 0;
	
	/** \brief Метод для получения кода рантайма.
	 *
	 * \return Код рантайма на JavaScript.
	 */
	virtual const std::string &runtime() const = 0;
};

#endif
