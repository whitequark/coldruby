$.define_class('Fixnum', $c.Integer, true);

$.define_method($c.Fixnum, 'to_s', 0, function(self) {
  return self.toString();
});

$.define_method($c.Fixnum, 'to_f', 0, function(self) {
  return $.float_new(self);
});

$.define_method($c.Fixnum, '+', 1, function(self, other) {
  return self + other;
});
$.define_method($c.Fixnum, '-', 1, function(self, other) {
  return self - other;
});
$.define_method($c.Fixnum, '*', 1, function(self, other) {
  return self * other;
});
$.define_method($c.Fixnum, '/', 1, function(self, other) {
  if(other == 0)
    this.raise(this.e.ZeroDivisionError, "divided by 0");

  return Math.floor(self / other);
});

$.define_method($c.Fixnum, '<=>', 1, function(self, other) {
  if(self > other) {
    return 1;
  } else if(self < other) {
    return -1;
  } else {
    return 0;
  }
});

$.define_method($c.Fixnum, 'size', 0, function(self) {
  return 4;
});

Number.prototype.klass = $c.Fixnum;
