run: runtime hello_ruby.js
	node hello_ruby.js

hello_ruby.js: nodejs-rack.js

%.js: %.rb
	coldruby-static -Enodejs -s$@ $<

runtime:
	coldruby-static -Enodejs -Rnode_modules/ruby.js

clean:
	rm *.js
