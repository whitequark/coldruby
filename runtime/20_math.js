$.define_module('Math');

$.define_singleton_method($c.Math, 'sqrt', 1, function(self, a) {
  a = this.to_float(a);

  return this.float_new(Math.sqrt(a.value));
});

$.define_singleton_method($c.Math, 'sin', 1, function(self, a) {
  a = this.to_float(a);

  return this.float_new(Math.sin(a.value));
});

$.define_singleton_method($c.Math, 'cos', 1, function(self, a) {
  a = this.to_float(a);

  return this.float_new(Math.cos(a.value));
});

$.define_singleton_method($c.Math, 'atan2', 2, function(self, a, b) {
  a = this.to_float(a);
  b = this.to_float(b);

  return this.float_new(Math.atan2(a.value, b.value));
});