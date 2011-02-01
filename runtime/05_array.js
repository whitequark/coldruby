$.define_builtin_class('Array', $c.Object);
$.define_method($c.Array, 'inspect', function(args, ctx) {
  var desc = [];
  for(var i = 0; i < this.length; i++) {
    desc.push($.invoke_method(this[i], 'inspect', [], ctx));
  }
  return "[" + desc.join(', ') + "]";
});

Array.prototype.klass = $c.Array;