$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return this.block_given_p() ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'proc', 0, function(self) {
  return this.block_proc();
});

$.define_method($c.Kernel, 'lambda', 0, function(self) {
  return this.block_lambda();
});

$.define_method($c.Kernel, 'raise', -1, function(self, args) {
  if(args.length == 0) {
    this.raise("");
  } else {
    this.check_args(args, 1, 2);
    this.raise(args[0], args[1], args[2], 1);
  }
});

$.define_method($c.Kernel, 'loop', 0, function(self) {
  while(true) {
    this.yield();
  }
  return Qnil;
});

$.define_method($c.Kernel, 'exit', -1, function(self, args) {
  this.raise2($e.SystemExit, args);
});

$c.Kernel.autoload = {};

$.define_method($c.Kernel, 'autoload', 2, function(self, constant, file) {
  this.check_type(constant, $c.Symbol);
  this.check_type(file,     $c.String);

  $c.Kernel.autoload[constant.value] = file;

  return Qnil;
});

$.define_method($c.Kernel, 'autoload?', 1, function(self, constant) {
  this.check_type(constant, $c.Symbol);

  return $c.Kernel.autoload[constant.value] || Qnil;
});

// Requires interpreter support at $it

$.define_method($c.Kernel, 'load', 1, function(self, file) {
  file = this.check_type(file, $c.String);

  $i.fail_in_eval = true;
  $it.load_context = this;
  $it.compile(file, this.funcall($.gvar_get('$:'), 'inspect'));
  $i.fail_in_eval = false;
});

$.define_method($c.Kernel, 'require', 1, function(self, file) {
  file = this.check_type(file, $c.String);

  var features = $.gvar_get('$"');
  for(var i = 0; i < features.length; i++) {
    if(features[i] == file) return Qfalse;
  }

  this.funcall(self, 'load', file);

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
  if(args.length == 0) {
    $i.print("\n");
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
