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

#include <getopt.h>
#include <stdio.h>
#include <errno.h>

#include <MRIRubyCompiler.h>

#include <string>
#include <vector>

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif

static const struct option longopts[] = {
	{ "static", optional_argument, NULL, 's' },
	{ "bare", no_argument, NULL, 'B' },
	{ "epilogue", required_argument, NULL, 'E' },
	{ "runtime", optional_argument, NULL, 'R' },

	{ "version", no_argument, NULL, 'v' },
	{ "help", no_argument, NULL, 'h' },

	{ NULL, no_argument, NULL, 0 }
};

enum InitFlag {
	FlagBare = 1
};

typedef struct {
	int flags;

	std::vector<std::string> execute;
	std::vector<std::string> files;

	std::string static_target;
	std::string runtime_target;
	std::string epilogue;
} init_data_t;

static void help(const char *app) {
	printf("Usage: %s [switches] [--] [programfile] [programfile]...\n"
	"  -e 'command'          one line of script. Several -e's allowed. Omit [programfile]\n"
	"  -s, --static=[FILE]   static mode: compile only. If FILE is not specified,\n"
	"                        output to stdout.\n"
	"  -B, --bare            do not include runtime or top-level wrapper into generated code.\n"
        "  -E, --epilogue=<TYPE> select epilogue type (global-ruby, nodejs, ...)\n"
        "  -R, --runtime=[FILE]  output runtime only, do not compile.\n"
	"  -h, --help            print this text\n"
	"  -v, --version         print the version\n"
	"\n"
	"Report " PACKAGE_NAME " bugs to " PACKAGE_BUGREPORT "\n", app);
}

static void version() {
	puts(PACKAGE_STRING);
}

static void usage(const char *app) {
	fprintf(stderr, "Try `%s --help' for more information.\n", app);
}

static bool write_file(const std::string &file, const std::string &content, std::string &error) {
	FILE *target;

	if(file == "-") {
		target = stdout;
	} else {
		target = fopen(file.c_str(), "wb");

		if(target == NULL) {
			error = strerror(errno);

			return false;
		}
	}

	size_t written = fwrite(content.data(), 1, content.size(), target);

	bool ret = written == content.size() || !ferror(target);

	if(!ret)
		error = strerror(errno);
		
	if(target != stdout)
		fclose(target);
	else
		clearerr(target);

	return ret;
}

static bool load_file(const std::string &filename, std::string &content, std::string &error) {
	FILE *file;
	bool ret = true;

	if(filename == "-") 
		file = stdin;
	else {
		file = fopen(filename.c_str(), "r");

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

static std::string compile_runtime(RubyCompiler *compiler) {
	const std::vector<ColdRubyRuntime> &runtime =
		compiler->runtime();

	std::string runtime_str;

	for(std::vector<ColdRubyRuntime>::const_iterator it =
		runtime.begin(); it != runtime.end(); it++) {

		runtime_str += "/* Runtime: " +
			(*it).file() + " */\n";

		runtime_str += (*it).code();
	}

	return runtime_str;
}

static int post_compiler(RubyCompiler *compiler, void *arg) {
	init_data_t *init = (init_data_t *) arg;

	if(compiler->boot(COMPILER_ROOT "/coldruby/compile.rb", init->epilogue) == false) {
		fprintf(stderr, "coldruby: compiler boot failed: %s\n", compiler->errorString().c_str());

		return 1;
	}

	if(!init->runtime_target.empty()) {

		std::string error;
		std::string runtime_str = compile_runtime(compiler);

		if(write_file(init->runtime_target, runtime_str, error) == false) {
			fprintf(stderr, "coldruby: %s: %s\n", init->runtime_target.c_str(), error.c_str());

			return 1;
		}

	}

	if(!init->static_target.empty()) {
		std::string compiled, error;

		if(!(init->flags & FlagBare)) {
			compiled = compile_runtime(compiler);	
		}

		if(init->execute.empty()) {
			for(std::vector<std::string>::const_iterator it = init->files.begin(); it != init->files.end(); it++) {
				std::string code, js;

				if(!load_file(*it, code, error)) {
					fprintf(stderr, "coldruby: %s: %s\n", (*it).c_str(), error.c_str());

					return 1;
				}

				if(!compiler->compile(code, *it, js, init->epilogue)) {
					fprintf(stderr, "coldruby: compile: %s: %s\n", (*it).c_str(), compiler->errorString().c_str());

					return 1;
				}

				compiled += js;				


			}
		} else {
			for(std::vector<std::string>::const_iterator it = init->execute.begin(); it != init->execute.end(); it++) {
				std::string js;

				if(!compiler->compile(*it, "<command line>", js, init->epilogue)) {
					fprintf(stderr, "coldruby: compile: <command line>: %s\n", compiler->errorString().c_str());

					return 1;
				}

				compiled += js;
			}
		}

		if(write_file(init->static_target, compiled, error) == false) {
			fprintf(stderr, "coldruby: %s: %s\n", init->static_target.c_str(), error.c_str());

			return 1;
		}
	}


	return 0;
}

int main(int argc, char *argv[]) {
	init_data_t init = { 0 };
	int ret, long_index;

	while((ret = getopt_long(argc, argv, "e:s::BE:R::hv", longopts, &long_index)) != -1) {
		switch(ret) {
		case 'e':
			init.execute.push_back(optarg);

			break;

		case 's':
			if(optarg)
				init.static_target = optarg;
			else
				init.static_target = "-";

			break;

		case 'B':
			init.flags |= FlagBare;

			break;

		case 'E':
			init.epilogue = optarg;

			break;

		case 'R':
			if(optarg)
				init.runtime_target = optarg;
			else
				init.runtime_target = "-";

			break;

		case 'v':
			version();

			return 0;

		case 'h':
			help(argv[0]);

			return 0;

		case '?':
		case ':':
			usage(argv[0]);

			return 1;
		}
	}

	if(init.execute.empty()) {
		if(optind < argc)
			while(optind < argc)
				init.files.push_back(argv[optind++]);
		else
			init.files.push_back("-");
	}

	MRIRubyCompiler compiler;

	return compiler.initialize(post_compiler, &init);
}


