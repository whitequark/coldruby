$.define_class('Array', $c.Object);
$.module_include($c.Array, $c.Enumerable);

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

$.define_method($c.Array, 'length', 0, function(self) {
  return self.length;
});
$.alias_method($c.Array, 'size', 'length');

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

$.define_method($c.Array, 'uniq!', 0, function(self) {
  // TODO
  return self;
});

$.define_method($c.Array, 'to_s', 0, function(self) {
  var desc = [];
  for(var i = 0; i < self.length; i++) {
    desc.push(this.funcall(self[i], 'inspect'));
  }
  return "[" + desc.join(', ') + "]";
});
$.alias_method($c.Array, 'inspect', 'to_s');

$.define_method($c.Array, 'join', -1, function(self, args) {
  $.check_args(args, 0, 1);

  var separator = this.check_convert_type(args[0] || this.gvar_get('$,'),
                          $c.String, 'to_s');

  var output = "";
  for(var i = 0; i < self.length; i++) {
    output += this.check_convert_type(self[i], $c.String, 'to_s');
    if(i < self.length - 1)
      output += separator;
  }

  return output;
});

Array.prototype.klass = $c.Array;
