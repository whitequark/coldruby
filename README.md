ColdRuby virtual machine
========================

Overview
--------

ColdRuby consists mainly of two distinctive parts: the bytecode 
compiler, which produces JavaScript code from YARV bytecode and runs on 
YARV itself, and the Ruby runtime library implemented in plain 
JavaScript. There is no direct link between parts; it is perfectly 
possible to pre-compile a bunch of source files and then load them in 
any ECMAScript capable agent, like Web browser, Flash applet or a 
standalone runner.

There is also an executable, which incorporates V8 JavaScript engine 
and allows standalone execution of Ruby scripts. It has its own 
extension interface, which is used to provide native-depending 
functionality to the runtime: regular expressions, fibers and more.

API
---

The API provided is, by an interesting coincidence, very similar to the 
Ruby C API (I, the author of ColdRuby, personally think that it is one 
of the best C APIs ever). It still may undergo major changes, so it 
won't be documented now; you can look in a generic runtime class 
implementation (like `runtime/05_hash.js`) or in the Ruby runtime 
itself (`runtime/01_ruby.js`).

Usage
-----

Currently there are two modes of operation: standalone and pure 
JavaScript. Both require the Ruby 1.9 installation. As there may be 
some differences in internal format of bytecode, which is parsed in 
ColdRuby, I should note that everything is currently tested on 
1.9.2-p136. The bytecode version used is `[1, 2, 1]'.

### Using standalone interpreter ###

Standalone interpreter is based on V8 engine; as such, you would need 
to have header files for that library. They are contained in package 
`libv8-dev` on Debian.

The build process is based on standard autoconf utilites.

If you've checked out the git version, you will need to run `autoreconf -i'
in the root of repository; if you do not want to install it to your system,
but rather use from the build directory, you should pass
`--enable-developer-mode' flag to configure script.

To build, just run `./configure && make'.

After the build has finished, you can execute scripts with the binary located
at `./coldruby/coldruby'.

### Compiling to pure JavaScript ###

You can use the executable to generate the code for Chrome browser or NodeJS.
To do that, you'll need to pass the `-s' option. If you'll specify a filename
(note that getopt expects it to be joined with the option, i.e.
`-sfilename.js'), the compiled code will be written to that file. Then, you
can run it in your favorite JavaScript interpreter.

Some examples of code runnable in browser and NodeJS will be provided when
the extension API will mature.

