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

#include <stdio.h>
#include <vector>
#include <getopt.h>
#include <string.h>
#include <errno.h>
#include <MRIRubyCompiler.h>
#include "ColdRubyVM.h"
#include "ColdRubyException.h"
#include "ColdRuby.h"

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif

typedef struct {
	int debugFlags;
	std::string content;
	std::string filename;
	std::vector<std::string> args;
} init_data_t;

static const struct option longopts[] = {
	{ "version", no_argument, NULL, 'v' },
	{ "help", no_argument, NULL, 'h' },

	{ NULL, no_argument, NULL, 0 }
};

static void usage(const char *app) {
	fprintf(stderr, "Try `%s --help' for more information.\n", app);
}

static void help(const char *app) {
	printf("Usage: %s [switches] [--] [programfile] [arguments]\n"
	"  -e 'command'         one line of script. Several -e's allowed. Omit [programfile]\n"
	"  -d                   enable virtual machine debugging.\n"
	"  -h, --help           print this text\n"
	"  -v, --version        print the version\n"
	"\n"
	"Report " PACKAGE_NAME " bugs to " PACKAGE_BUGREPORT "\n", app);
}

static void version() {
	puts(PACKAGE_STRING);
}

static int post_compiler(RubyCompiler *compiler, void *arg) {
	init_data_t *init = (init_data_t *) arg;

	if(compiler->boot(COMPILER_ROOT "/coldruby/compile.rb", std::string()) == false) {
		fprintf(stderr, "coldruby: compiler boot failed: %s\n", compiler->errorString().c_str());

		return 1;
	}

	ColdRubyVM::setDebugFlags(init->debugFlags);

	atexit(ColdRubyVM::cleanup);

	ColdRubyVM vm;

	if(vm.initialize(compiler) == false) {
		fprintf(stderr, "coldruby: vm.initialize: %s\n", vm.errorString().c_str());

		return 1;
	}


	ColdRuby *ruby = vm.createRuby();

	if(ruby == NULL) {
		fprintf(stderr, "coldruby: ruby creation failed: %s\n", vm.errorString().c_str());

		return 1;
	}

	try {
		std::vector<std::string> path;

		path.push_back(STDLIB_ROOT);
		path.push_back(EXTENSION_ROOT);

		ruby->setSearchPath(path);

		ruby->run(init->content, init->filename);
	} catch(const ColdRubyException &e) {
		fprintf(stderr, "coldruby: %s\n", e.what());

		std::string info = e.exceptionInfo();

		if(info.length() > 0) {
			fputs(info.c_str(), stderr);
			fputc('\n', stderr);
		}


		return 1;
	}

	delete ruby;

	return 0;
}

static bool load_file(const char *filename, std::string &content, std::string &error) {
	FILE *file;
	bool ret = true;

	if(strcmp(filename, "-") == 0)
		file = stdin;
	else {
		file = fopen(filename, "r");

		if(file == NULL) {
			error = std::string(strerror(errno));

			return false;
		}
	}

	char *buf = new char[8192];

	while(fgets(buf, 8192, file) != 0)
		content += std::string(buf);

	delete buf;

	if(ferror(file)) {
		error = std::string(strerror(errno));

		ret = false;
	}

	if(file != stdin)
		fclose(file);

	return ret;
}

int main(int argc, char *argv[]) {
	int ret, longidx;

	MRIRubyCompiler::sysinit(&argc, &argv);
	std::vector<std::string> execute;

	init_data_t init = { 0 };
	int debugRepeats = 0;

	while((ret = getopt_long(argc, argv, "+vhe:d", longopts, &longidx)) != -1) {
		switch(ret) {
		case '?':
		case ':':
			usage(argv[0]);

			return 1;

		case 'v':
			version();

			return 0;

		case 'h':
			help(argv[0]);

			return 0;

		case 'e':
			execute.push_back(optarg);

			break;


		case 'd':
			init.debugFlags |= (1 << debugRepeats++);

			break;
		}
	}


	if(execute.empty()) {
		const char *filename;

		if(optind < argc) {
			filename = argv[optind++];
			init.filename = filename;
		} else {
			filename = "-";
			init.filename = "<standard input>";
		}

		std::string error;

		if(load_file(filename, init.content, error) == false) {
			fprintf(stderr, "coldruby: %s: %s\n", filename, error.c_str());

			return 1;
		}

		while(optind < argc)
			init.args.push_back(argv[optind++]);
	} else {
 		init.filename = "<command line>";

		for(std::vector<std::string>::const_iterator it = execute.begin(); it != execute.end(); it++) {
			init.content += *it;
			init.content += "\n";
		}
	}

	MRIRubyCompiler compiler;

	return compiler.initialize(post_compiler, &init);
}
