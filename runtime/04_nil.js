$.define_class('NilClass', $c.Class, true);
$.undef_singleton_method($c.NilClass, 'allocate');

$.define_method($c.NilClass, 'inspect', 0, function(self) {
  return this.string_new("nil");
});

$.define_method($c.NilClass, '&', 1, function(self, other) {
  return Qfalse;
});

$.define_method($c.NilClass, '|', 1, function(self, other) {
  return $.test(other) ? Qtrue : Qfalse;
});

$.define_method($c.NilClass, '^', 1, function(self, other) {
  return $.test(other) ? Qtrue : Qfalse;
});

$.define_method($c.NilClass, 'nil?', 0, function(self) {
  return Qtrue;
});

$.define_method($c.NilClass, 'to_s', 0, function(self) {
  return this.string_new("");
});

$.define_method($c.NilClass, 'to_i', 0, function(self) {
  return 0;
});

$.define_method($c.NilClass, 'hash', 0, function(self) {
  return self.hash;
});

var Qnil = $.builtin.Qnil = {
  klass: $c.NilClass,
  hash:  $.hash($c.NilClass.hash_seed, 'nil'),
  toString: function() { return "#<nil>"; }
};
