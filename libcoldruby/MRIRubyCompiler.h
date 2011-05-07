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
 * \file libcoldruby/MRIRubyCompiler.h
 * \brief Заголовочный файл класса \ref MRIRubyCompiler.
 */

#ifndef __MRI_RUBY_COMPILER__H__
#define __MRI_RUBY_COMPILER__H__

#include "StandardRubyCompiler.h"
#include "ColdRubyRuntime.h"

#include <ruby.h>

/**
 * \brief Макрос для преобразования строки MRI в std::string.
 *
 * \param s VALUE, содержащее строку Ruby.
 * \return std::string с преобразованной строкой.
 */
#define RSTRING_STD(s) (TYPE(s) == T_STRING ? std::string(RSTRING_PTR(s), RSTRING_LENINT(s)) : std::string("<NOT A STRING>"))

/**
 * \brief Реализация компилятора Ruby, использующая MRI.
 */

class MRIRubyCompiler: public StandardRubyCompiler {
	/**
	 * \brief Структура для обмена данными с защищенным кодом.
	 */
	typedef struct {
		MRIRubyCompiler *this_compiler;
		const std::string &code;
		const std::string &file;
		std::string &js;
		const std::string &epilogue;
	} compile_data_t;

public:
	/** \brief Метод для инициализации аргументов командной строки MRI.
	 *
	 * Вызывает ruby_sysinit(argc, argv). Не имеет каких-либо серьезных
	 * побочных эффектов, может быть вызвана без последующего вызова
	 * \ref initialize.
	 *
	 * \param argc Указатель на переменную, содержающую число аргументов.
	 * \param argv Указатель на массив C-строк, содержащих аргументы.
	 */
	static void sysinit(int *argc, char ***argv);

	/** \brief Метод для инициализации стека.
	 *
	 * Инициализирует стек макросом RUBY_INIT_STACK, MRI функцией
	 * ruby_init и затем вызывает post_init.
	 *
	 * До вызова этого метода аргументы MRI должны быть проинициализированы
	 * методом \ref sysinit. Метод может быть вызван только один раз за
	 * время жизни процесса. Метод должен быть вызван из основного потока.
	 * Для корректной работы механизма исключений MRI SP не должен
	 * подниматься выше того значения, которое было перед вызовом
	 * post_init.
	 *
	 * \param post_init Функция, которая будет вызвана после инициализации.
	 * \param arg Аргумент для функции.
	 * \return Значение, возвращенное post_init.
	 */
	virtual int initialize(post_init_t post_init, void *arg);

	virtual bool boot(const std::string &code, const std::string &file, const std::string &epilogue);

	virtual bool compile(const std::string &code, const std::string &file, std::string &js, const std::string &epilogue);

	virtual const std::vector<ColdRubyRuntime> &runtime() const;
private:
	static VALUE boot_protected_wrapper(VALUE arg);
	static VALUE compile_protected_wrapper(VALUE arg);

	void boot_protected(compile_data_t *data);
	void compile_protected(compile_data_t *data);

	void mri_exception();

	std::vector<ColdRubyRuntime> m_runtime;
};

#endif
