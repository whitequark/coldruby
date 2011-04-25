$.define_class('Float', $c.Object, true);

$.float_new = function(value) {
  return {
    klass: $c.Float,
    value: value,
  };
};

$.define_method($c.Float, 'to_s', 0, function(self) {
  if(self.value == Math.floor(self.value)) {
    return self.value.toString() + '.0';
  } else {
    return self.value.toString();
  }
});

$.define_method($c.Float, 'to_f', 0, function(self) {
  return self;
});

$.define_method($c.Float, 'to_i', 0, function(self) {
  return Math.floor(self.value);
});
$.alias_method($c.Float, 'floor', 'to_i');
$.alias_method($c.Float, 'truncate', 'to_i');

$.define_method($c.Float, '-@', 1, function(self) {
  return $.float_new(-self.value);
});
$.define_method($c.Float, '+@', 1, function(self) {
  return self;
});

$.define_method($c.Float, '+', 1, function(self, other) {
  other = this.funcall(other, 'to_f');
  return $.float_new(self.value + other.value);
});
$.define_method($c.Float, '-', 1, function(self, other) {
  other = this.funcall(other, 'to_f');
  return $.float_new(self.value - other.value);
});
$.define_method($c.Float, '*', 1, function(self, other) {
  other = this.funcall(other, 'to_f');
  return $.float_new(self.value * other.value);
});
$.define_method($c.Float, '/', 1, function(self, other) {
  other = this.funcall(other, 'to_f');
  return $.float_new(self.value / other.value);
});
$.define_method($c.Float, '%', 1, function(self, other) {
  other = this.funcall(other, 'to_f');
  return $.float_new(self.value % other.value);
});
