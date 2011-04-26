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

$.define_method($c.Float, 'to_int', 0, function(self) {
  return Math.floor(self.value);
});
$.alias_method($c.Float, 'to_i', 'to_int');
$.alias_method($c.Float, 'floor', 'to_int');
$.alias_method($c.Float, 'truncate', 'to_int');

$.define_method($c.Float, '-@', 1, function(self) {
  return $.float_new(-self.value);
});

$.define_method($c.Float, '+@', 1, function(self) {
  return self;
});

$.define_method($c.Float, '+', 1, function(self, other) {
  return $.float_new(self.value + this.to_float(other).value);
});

$.define_method($c.Float, '-', 1, function(self, other) {
  return $.float_new(self.value - this.to_float(other).value);
});

$.define_method($c.Float, '*', 1, function(self, other) {
  return $.float_new(self.value * this.to_float(other).value);
});

$.define_method($c.Float, '/', 1, function(self, other) {
  return $.float_new(self.value / this.to_float(other).value);
});

$.define_method($c.Float, '%', 1, function(self, other) {
  return $.float_new(self.value % this.to_float(other).value);
});
