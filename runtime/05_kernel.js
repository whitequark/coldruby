$.define_method($c.Object, 'p', function(args, ctx) {
  for(var i = 0; i < args.length; i++) {
    var obj = args[i];
    print($.invoke_method(obj, 'inspect', [], ctx));
  }
  return args;
});

$.define_method($c.Object, 'puts', function(args, ctx) {
  for(var i = 0; i < args.length; i++) {
    var obj = args[i];
    print($.invoke_method(obj, 'to_s', [], ctx));
  }
  return Qnil;
});

$.define_method($c.Object, 'test', function(args) {
  return Math.random() >= 0.5 ? Qtrue : Qfalse;
});