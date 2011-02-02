$c.Kernel = $.define_module('Kernel'); // while we have no mixins

$.module_include($c.Object, $c.Kernel);

$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return $.block_given() ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'load', 1, function(self, file) {
  file = $.check_type(file, $c.String);
  print("Loading " + file);
});

$.define_method($c.Kernel, 'p', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    print($.invoke_method(this, args[i], 'inspect', []));
  }
  return args;
});

$.define_method($c.Kernel, 'puts', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    print($.invoke_method(this, args[i], 'to_s', []));
  }
  return Qnil;
});
