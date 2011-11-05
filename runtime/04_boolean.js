$.define_class('TrueClass', $c.Object, true);
$.undef_singleton_method($c.TrueClass, 'allocate');

$.define_method($c.TrueClass, 'to_s', 0, function(self) {
  return this.string_new("true");
});

$.define_method($c.TrueClass, '&', 1, function(self, other) {
  return $.test(other) ? Qtrue : Qfalse;
});

$.define_method($c.TrueClass, '|', 1, function(self, other) {
  return Qtrue;
});

$.define_method($c.TrueClass, '^', 1, function(self, other) {
  return $.test(other) ? Qfalse : Qtrue;
});

$.define_method($c.TrueClass, 'hash', 0, function(self) {
  return self.hash;
});

var Qtrue  = $.builtin.Qtrue = {
  klass: $c.TrueClass,
  hash:  $.hash($c.TrueClass.hash_seed, 'true'),
  toString: function() { return "#<true>"; }
};

$.define_class('FalseClass', $c.Object, true);
$.undef_singleton_method($c.FalseClass, 'allocate');

$.define_method($c.FalseClass, 'to_s', 0, function(self) {
  return this.string_new("false");
});

$.define_method($c.FalseClass, '&', 1, function(self, other) {
  return Qfalse;
});

$.define_method($c.FalseClass, '|', 1, function(self, other) {
  return $.test(other) ? Qtrue : Qfalse;
});

$.define_method($c.FalseClass, '^', 1, function(self, other) {
  return $.test(other) ? Qtrue : Qfalse;
});

$.define_method($c.FalseClass, 'hash', 0, function(self) {
  return self.hash;
});

var Qfalse = $.builtin.Qfalse = {
  klass: $c.FalseClass,
  hash:  $.hash($c.FalseClass.hash_seed, 'false'),
  toString: function() { return "#<false>"; }
};
