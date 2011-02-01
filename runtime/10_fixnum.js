$.define_bare_class('Fixnum', $c.Integer);

$.define_method($c.Fixnum, 'to_s', 0, function(self) {
  return self.toString();
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

Number.prototype.klass = $c.Fixnum;