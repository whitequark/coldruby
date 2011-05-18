$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return this.block_given_p(this.context.sf.parent) ? Qtrue : Qfalse;
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
  return this.protect(function() {
    while(true)
      this.yield1();

    return Qnil;
  }, function(e) {
    if(this.test(this.funcall($e.StopIteration, '===', e))) {
      return this.funcall(e, 'result');
    } else {
      this.raise3(e);
    }
  });
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

$.define_method($c.Kernel, 'p', -1, function(self, args) {
  for(var i = 0; i < args.length; i++)
    this.funcall(self, 'puts', this.funcall(args[i], 'inspect'));

  if(args.length > 1) {
    return args;
  } else {
    return args[0] == null ? Qnil : args[0];
  }
});

