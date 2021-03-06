$.define_class('Float', $c.Numeric, true);
$.undef_singleton_method($c.Float, 'allocate');

$.float_new = function(value) {
  return {
    klass: $c.Float,
    value: value,
  };
};

$.define_method($c.Float, '==', 1, function(self, other) {
  return (self.value == this.to_float(other).value) ? Qtrue : Qfalse;
});

$.define_method($c.Float, 'to_s', 0, function(self) {
  if(self.value == Math.floor(self.value)) {
    return this.string_new(self.value.toString() + '.0');
  } else {
    return this.string_new(self.value.toString());
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

$.define_method($c.Float, '<=>', 1, function(self, other) {
  other = this.to_float(other);

  if(self.value > other.value) {
    return 1;
  } else if(self.value < other.value) {
    return -1;
  } else {
    return 0;
  }
});

$.define_method($c.Float, 'hash', 0, function(self) {
  return $.hash(self.klass.hash_seed, self.toString());
});