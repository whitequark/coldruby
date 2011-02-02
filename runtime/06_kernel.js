$c.Kernel = $.define_module('Kernel'); // while we have no mixins

$.module_include($c.Object, $c.Kernel);

$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return $.block_given() ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'load', 1, function(self, file) {
  file = $.check_type(file, $c.String);
  $it.compile(file, $.invoke_method(this, $.gvar_get('$:'), 'inspect', []));
});

$.define_method($c.Kernel, 'require', 1, function(self, file) {
  file = $.check_type(file, $c.String);

  var features = $.gvar_get('$"');
  for(var i = 0; i < features.length; i++) {
    if(features[i] == file) return Qfalse;
  }

  $it.compile(file, $.invoke_method(this, $.gvar_get('$:'), 'inspect', []));
  features.push(file);

  return Qtrue;
});

$.define_method($c.Kernel, 'eval', 1, function(self, code) {
  code = $.check_type(file, $c.String);
  $it.eval(code);
});

$.define_method($c.Kernel, 'p', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    $i.print($.invoke_method(this, args[i], 'inspect', []) + "\n");
  }
  return args;
});

$.define_method($c.Kernel, 'puts', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    $i.print($.invoke_method(this, args[i], 'to_s', []) + "\n");
  }
  return Qnil;
});
