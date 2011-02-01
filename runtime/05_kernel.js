$c.Kernel = $c.Object; // while we have no mixins

$.define_method($c.Kernel, 'block_given?', 0, function(self) {
  return $.block_given() ? Qtrue : Qfalse;
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
