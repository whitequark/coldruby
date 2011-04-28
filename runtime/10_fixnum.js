$.define_class('Fixnum', $c.Integer, true);

$.define_method($c.Fixnum, 'to_str', 0, function(self) {
  return this.string_new(self.toString());
});
$.alias_method($c.Fixnum, 'to_s', 'to_str');

$.define_method($c.Fixnum, 'to_f', 0, function(self) {
  return $.float_new(self);
});

$.define_method($c.Fixnum, '+', 1, function(self, other) {
  return self + this.to_int(other);
});

$.define_method($c.Fixnum, '-', 1, function(self, other) {
  return self - this.to_int(other);
});

$.define_method($c.Fixnum, '*', 1, function(self, other) {
  return self * this.to_int(other);
});

$.define_method($c.Fixnum, '/', 1, function(self, other) {
  other = this.to_int(other);
  if(other == 0)
    this.raise(this.e.ZeroDivisionError, "divided by 0");

  return Math.floor(self / other);
});

$.define_method($c.Fixnum, '%', 1, function(self, other) {
  other = this.to_int(other);
  if(other == 0)
    this.raise(this.e.ZeroDivisionError, "divided by 0");

  return self % other;
});

$.define_method($c.Fixnum, '<=>', 1, function(self, other) {
  if(self == other) return 0;
  if(typeof other == "number") {
    if(self > other) return 1;
    return -1;
  }

  return Qnil;
});

$.define_method($c.Fixnum, 'size', 0, function(self) {
  return 4;
});

Number.prototype.klass = $c.Fixnum;
