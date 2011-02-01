$.define_builtin_class('Fixnum', $c.Object);

$.define_method($c.Fixnum, 'to_s', 0, function(self) {
  return self.toString();
});

$.define_method($c.Fixnum, '+', 1, function(self, other) {
  return self + other;
});

$.define_method($c.Fixnum, '<', 1, function(self, other) {
  return self < other ? Qtrue : Qfalse;
});

Number.prototype.klass = $c.Fixnum;