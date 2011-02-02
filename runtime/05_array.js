$.define_class('Array', $c.Object);

$.define_method($c.Array, 'each', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    $.yield(this, [self[i]]);
  }
  return self;
});

$.define_method($c.Array, 'push', 1, function(self, obj) {
  self.push(obj);
  return self;
});
$.alias_method($c.Array, '<<', 'push');

$.define_method($c.Array, 'pop', 0, function(self) {
  return self.pop();
});

$.define_method($c.Array, 'unshift', 1, function(self, obj) {
  self.unshift(obj);
  return self;
});

$.define_method($c.Array, 'shift', 0, function(self) {
  return self.shift();
});

$.define_method($c.Array, 'inspect', 0, function(self) {
  var desc = [];
  for(var i = 0; i < self.length; i++) {
    desc.push($.invoke_method(this, self[i], 'inspect', []));
  }
  return "[" + desc.join(', ') + "]";
});

Array.prototype.klass = $c.Array;