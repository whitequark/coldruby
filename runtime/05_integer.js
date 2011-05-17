$.define_class('Integer', $c.Numeric);

$.define_method($c.Integer, 'to_int', 0, function(self) {
  return self;
});
$.alias_method($c.Integer, 'to_i', 'to_int');
$.alias_method($c.Integer, 'floor', 'to_int');
$.alias_method($c.Integer, 'ceil', 'to_int');
$.alias_method($c.Integer, 'round', 'to_int');
$.alias_method($c.Integer, 'truncate', 'to_int');

$.define_method($c.Integer, 'times', 0, function(self) {
  if(typeof self == 'number') {
    for(var i = 0; i < self; i++) {
      this.yield1(i);
    }
  } else {
    var i = 0;

    while($.test(this.funcall(i, '<', self))) {
      this.yield1(i);

      i = this.funcall(i, '+', 1);
    }
  }

  return self;
});

$.define_method($c.Integer, 'upto', 1, function(from, to) {
  if(typeof from == 'number' && typeof to == 'number') {
    for(var i = from; i <= to; i++) {
      this.yield1(i);
    }
  } else {
    var i = 0;

    while(!$.test(this.funcall(i, '>', self))) {
      this.yield1(i);

      i = this.funcall(i, '+', 1);
    }
  }

  return from;
});

$.define_method($c.Integer, 'downto', 1, function(from, to) {
  if(typeof from == 'number' && typeof to == 'number') {
    for(var i = from; i >= to; i--) {
      this.yield1(i);
    }
  } else {
    var i = 0;

    while(!$.test(this.funcall(i, '<', self))) {
      this.yield1(i);

      i = this.funcall(i, '-', 1);
    }
  }

  return from;
});

$.define_method($c.Integer, 'integer?', 0, function(self) {
  return Qtrue;
});

$.define_method($c.Integer, 'even?', 0, function(self) {
  return this.funcall(self, '%', 2) == 0 ? Qtrue : Qfalse;
});

$.define_method($c.Integer, 'odd?', 0, function(self) {
  return this.funcall(self, '%', 2) != 0 ? Qtrue : Qfalse;
});

$.define_method($c.Integer, 'succ', 0, function(self) {
  if(typeof self == 'number') // Fixnum
    return self + 1;

  return this.funcall(self, '+', 1);
});
$.alias_method($c.Integer, 'next', 'succ');

$.define_method($c.Integer, 'pred', 0, function(self) {
  if(typeof self == 'number') // Fixnum
    return self - 1;

  return this.funcall(self, '-', 1);
});

$.define_method($c.Integer, 'numerator', 0, function(self) {
  return self;
});

$.define_method($c.Integer, 'denominator', 0, function(self) {
  return 1;
});
