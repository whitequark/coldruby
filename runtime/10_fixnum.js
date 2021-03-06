$.define_class('Fixnum', $c.Integer, true);
$.undef_singleton_method($c.Fixnum, 'allocate');

$.define_method($c.Fixnum, 'to_s', 0, function(self) {
  return this.string_new(self.toString());
});

$.define_method($c.Fixnum, 'to_f', 0, function(self) {
  return $.float_new(self);
});

$.define_method($c.Fixnum, '-@', 0, function(self) {
  return -self;
});

$.define_method($c.Fixnum, '==', 1, function(self, other) {
  return this.obj_is_kind_of(other, $c.Numeric) &&
             (self == this.to_float(other).value) ? Qtrue : Qfalse;
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
$.alias_method($c.Fixnum, 'modulo', '%');

$.define_method($c.Fixnum, '**', 1, function(self, power) {
  if(typeof power == "number" && power > 0) {
    return Math.floor(Math.pow(self, power));
  } else {
    return this.float_new(Math.pow(self, this.to_float(power).value));
  }
});

$.define_method($c.Fixnum, '~', 1, function(self) {
  return ~self;
});

$.define_method($c.Fixnum, '&', 1, function(self, other) {
  return self & this.to_int(other);
});

$.define_method($c.Fixnum, '|', 1, function(self, other) {
  return self | this.to_int(other);
});

$.define_method($c.Fixnum, '^', 1, function(self, other) {
  return self ^ this.to_int(other);
});

$.define_method($c.Fixnum, '[]', 1, function(self, bit) {
  return (self >> this.to_int(bit)) & 1;
});

$.define_method($c.Fixnum, 'abs', 0, function(self) {
  if(self < 0)
    return -self;

  return self;
});
$.alias_method($c.Fixnum, 'magnitude', 'abs');

$.define_method($c.Fixnum, 'zero?', 0, function(self) {
  return (self == 0) ? Qtrue : Qfalse;
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

$.define_method($c.Fixnum, 'hash', 0, function(self) {
  return $.hash(self.klass.hash_seed, self.toString());
});

Number.prototype.klass = $c.Fixnum;
