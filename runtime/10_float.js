$.define_module('Float', $c.Class);

$.builtin.make_float = function(value) {
  return {
    klass: $c.Float,
    value: value,
  };
};

$.define_method($c.Float, 'to_s', 0, function(self) {
  return self.value.toString();
});

$.define_method($c.Float, 'to_f', 0, function(self) {
  return self;
});

$.define_method($c.Float, 'to_i', 0, function(self) {
  return Math.floor(self.value);
});
$.alias_method($c.Float, 'floor', 'to_i');
$.alias_method($c.Float, 'Truncate', 'to_i');