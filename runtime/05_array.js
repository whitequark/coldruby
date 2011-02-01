$.define_builtin_class('Array', $c.Object);
$.define_method($c.Array, 'inspect', 0, function(self) {
  var desc = [];
  for(var i = 0; i < self.length; i++) {
    desc.push($.invoke_method(self[i], 'inspect', [], this));
  }
  return "[" + desc.join(', ') + "]";
});

Array.prototype.klass = $c.Array;