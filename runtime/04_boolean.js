$.define_module('TrueClass', $c.Class);

$.define_method($c.TrueClass, 'to_s', 0, function(self) {
  return "true";
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

var Qtrue  = $.builtin.Qtrue = {
  klass: $c.TrueClass,
};

$.define_module('FalseClass', $c.Class);

$.define_method($c.FalseClass, 'to_s', 0, function(self) {
  return "false";
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

var Qfalse = $.builtin.Qfalse = {
  klass: $c.FalseClass,
};

