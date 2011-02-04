$.define_class('Array', $c.Object);

$.define_method($c.Array, 'each', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    this.yield(self[i]);
  }
  return self;
});

$.define_method($c.Array, '[]', 1, function(self, index) {
  this.check_convert_type(index, $c.Fixnum, 'to_i');
  return self[index] == null ? Qnil : self[index];
});

$.define_method($c.Array, '[]=', 2, function(self, index, value) {
  this.check_convert_type(index, $c.Fixnum, 'to_i');
  self[index] = value;
  return value;
});

$.define_method($c.Array, 'any?', 0, function(self) {
  return self.length > 0 ? Qtrue : Qfalse;
});

$.define_method($c.Array, 'empty?', 0, function(self) {
  return self.length == 0 ? Qtrue : Qfalse;
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
    desc.push(this.funcall(self[i], 'inspect'));
  }
  return "[" + desc.join(', ') + "]";
});

Array.prototype.klass = $c.Array;