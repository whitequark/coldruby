$.define_module('Comparable');

var cmpint = function(val, a, b) {
  if(val == Qnil) {
    var classname;

    if(b == Qtrue || b == Qfalse || b == Qnil) {
      classname = this.funcall(b, 'inspect');
    } else {
      classname = this.obj_classname(b);
    }

    this.raise($e.ArgumentError, "comparsion of " + this.obj_classname(a) +
                            " with " + classname + " failed");
  }

  if(typeof val == "number") {
    if(val < 0) return -1;
    if(val > 0) return 1;
    return 0;
  }

  if(this.test(this.funcall(val, '<', 0))) return -1;
  if(this.test(this.funcall(val, '>', 0))) return 1;
  return 0;
};

$.define_method($c.Comparable, '==', 1, function(self, other) {
  if(self == other)
    return Qtrue;
  if(other == Qnil)
    return Qfalse;

  return this.protect(function() {
    var c = this.funcall(self, '<=>', other);

    if(cmpint.call(this, c, self, other) == 0)
      return Qtrue;

    return Qfalse;
  }, function() {
    return Qfalse;
  });
});

$.define_method($c.Comparable, '>', 1, function(self, other) {
  var c = this.funcall(self, '<=>', other);

  if(cmpint.call(this, c, self, other) > 0)
    return Qtrue;

  return Qfalse;
});

$.define_method($c.Comparable, '>=', 1, function(self, other) {
  var c = this.funcall(self, '<=>', other);

  if(cmpint.call(this, c, self, other) >= 0)
    return Qtrue;

  return Qfalse;
});

$.define_method($c.Comparable, '<=', 1, function(self, other) {
  var c = this.funcall(self, '<=>', other);

  if(cmpint.call(this, c, self, other) <= 0)
    return Qtrue;

  return Qfalse;
});

$.define_method($c.Comparable, '<', 1, function(self, other) {
  var c = this.funcall(self, '<=>', other);

  if(cmpint.call(this, c, self, other) < 0)
    return Qtrue;

  return Qfalse;
});
