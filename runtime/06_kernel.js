$c.Kernel = $.define_module('Kernel'); // while we have no mixins

$.module_include($c.Object, $c.Kernel);

$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return this.block_given() ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'proc', 0, function(self) {
  return this.funcall(this.c.Proc, 'new');
});

$.define_method($c.Kernel, 'lambda', 0, function(self) {
  if(this.context.sf.block.lambda == undefined) {
    this.context.sf.block.lambda = true;
  }

  return this.funcall(this.c.Proc, 'new');
});

$.define_method($c.Kernel, 'raise', -1, function(self, args) {
  this.check_args(args, 1, 2);
  this.raise(args[0], args[1], args[2], 1);
});

$.define_method($c.Kernel, 'loop', 0, function(self) {
  while(true) {
    this.yield();
  }
  return Qnil;
});

// Requires interpreter support at $it

$.define_method($c.Kernel, 'load', 1, function(self, file) {
  file = this.check_type(file, $c.String);

  $it.load_context = this;
  $it.compile(file, this.funcall($.gvar_get('$:'), 'inspect'));
});

$.define_method($c.Kernel, 'require', 1, function(self, file) {
  file = this.check_type(file, $c.String);

  var features = $.gvar_get('$"');
  for(var i = 0; i < features.length; i++) {
    if(features[i] == file) return Qfalse;
  }

  $it.load_context = this;
  $it.compile(file, this.funcall($.gvar_get('$:'), 'inspect'));
  features.push(file);

  return Qtrue;
});

$.define_method($c.Kernel, 'eval', 1, function(self, code) {
  code = this.check_type(code, $c.String);
  $it.load_context = this;
  return $it.eval(code, '[\"(eval)\",null,1]');
});

// A (hacky) console user interface
// Requires interpreter support at $i

$.define_method($c.Kernel, 'p', -1, function(self, args) {
  for(var i = 0; i < args.length; i++)
    this.funcall(self, 'puts', this.funcall(args[i], 'inspect'));

  if(args.length > 1) {
    return args;
  } else {
    return args[0] == null ? Qnil : args[0];
  }
});

$.define_method($c.Kernel, 'puts', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    $i.print(this.funcall(args[i], 'to_s') + "\n");
  }
  return Qnil;
});

$.define_method($c.Kernel, 'print', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    $i.print(this.funcall(args[i], 'to_s'));
  }
  return Qnil;
});

$.define_method($c.Kernel, 'gets', 0, function(self) {
  var str = $i.gets();
  return str == null ? Qnil : str;
});
