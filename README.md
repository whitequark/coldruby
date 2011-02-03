ColdRuby YARV Translator
========================

Overview
--------

ColdRuby consists mainly of two distinctive parts: the bytecode compiler, 
which produces JavaScript code from YARV bytecode and runs on YARV itself, and 
the Ruby runtime library implemented in plain JavaScript. There is no direct 
link between parts; it is perfectly possible to pre-compile a bunch of source 
files and then load them in any ECMAScript capable agent, like Web browser, 
Flash applet or a standalone runner.

One example of such a standalone runner is provided, too. It is based on 
Google's very fast V8 scripting engine. To allow using familiar directives 
such as `require` and `eval` (the latter, being not a good solution by itself, 
still allows implementing REPL's like `irb` has, which is rather useful 
feature), there is a small glue layer which spawns a compiler in the 
background and compiles any `load`'ed or `eval`'d code.

API
---

The API provided is, by an interesting coincidence, very similar to the Ruby C 
API (I, the author of ColdRuby, personally think that it is one of the bese C 
API's). It still may undergo major changes, so it won't be documented now; you 
can look in a generic runtime class implementation (like `runtime/05_hash.js`) 
or in the Ruby runtime itself (`runtime/01_ruby.js`).

Usage
-----

Currently there are two modes of operation: standalone and pure JavaScript. 
Both require the Ruby 1.9 installation. As there may be some differences in 
internal format of bytecode, which is parsed in ColdRuby, I should note that 
everything is currently tested on 1.9.2-p136. The bytecode version used is 
`[1, 2, 1]`; it can be changed in `lib/coldruby/iseq.rb`.

### Using standalone interpreter ###

Standalone interpreter is based on V8 engine; as such, you would need to have 
header files for that library. They are contained in package `libv8-dev` on 
Debian.

Then, you would need to compile the binary. Execute `make` in root of the 
source snapshot; it should compile the `coldruby` binary.

It can then be launched with script filenames as arguments, like `./coldruby 
test/test.rb`. Beware that it is not supposed to start from any directory 
other than root of source snapshot; it will probably fail at loading stdlib 
otherwise.

### Compiling to pure JavaScript ###

The Ruby script `lib/commands/testbench.rb` reads exactly one file passed as 
an argument, and then produces a single JavaScript file with VM and the code 
which can be just loaded and run.

It expects to have a global `$it` object for external methods. Currently the 
one method used is `print`, referred from `Kernel#puts` and `Kernel#p`.

It can be defined this way to run in Chrome:

    $it = {
      print: function(string) {
        console.log(string);
      },
    };

The `load` and `require` commands will not work (obviously).
