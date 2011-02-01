$.define_method($c.Object, 'p', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    print($.invoke_method(this, args[i], $.sym2id('inspect'), []));
  }
  return args;
});

$.define_method($c.Object, 'puts', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    print($.invoke_method(this, args[i], $.sym2id('to_s'), []));
  }
  return Qnil;
});

$.define_method($c.Object, 'test', 0, function(self) {
  return Math.random() >= 0.5 ? Qtrue : Qfalse;
});