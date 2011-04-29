$.define_class('Numeric', $c.Object);
$.module_include($c.Numeric, $c.Comparable);

$.define_method($c.Numeric, 'eql?', 1, function(self, other) {
  return ((self.klass == other.klass) &&
          (this.test(this.funcall(self, '==', other)))) ? Qtrue : Qfalse;
});

$.define_method($c.Numeric, 'nonzero?', 0, function(self) {
  return this.test(this.funcall(self, 'zero?')) ? Qfalse : Qtrue;
});

$.define_method($c.Numeric, 'to_int', 0, function(self) {
  return this.funcall(self, 'to_i');
});

$.define_method($c.Numeric, 'truncate', 0, function(self) {
  return this.funcall(this.to_float(self), 'truncate');
});

$.define_method($c.Numeric, 'zero?', 0, function(self) {
  return this.funcall(self, '==', 0);
});
