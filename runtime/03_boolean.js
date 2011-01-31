$.define_builtin_class('TrueClass',  $c.Object);
$.define_method($c.TrueClass, 'to_s', function(args) {
  $.check_args(args, 0);
  return "true";
});
$.define_method($c.TrueClass, '&', function(args) {
  return $.test(args[0]) ? Qtrue : Qfalse;
});
$.define_method($c.TrueClass, '|', function(args) {
  return Qtrue;
});
$.define_method($c.TrueClass, '^', function(args) {
  return $.test(args[0]) ? Qfalse : Qtrue;
});

var Qtrue  = $.builtin.Qtrue = {
  klass: $c.TrueClass,  
};

$.define_builtin_class('FalseClass', $c.Object);
$.define_method($c.FalseClass, 'to_s', function(args) {
  $.check_args(args, 0);
  return "false";
});
$.define_method($c.FalseClass, '&', function(args) {
  return Qfalse;
});
$.define_method($c.FalseClass, '|', function(args) {
  return $.test(args[0]) ? Qtrue : Qfalse;
});
$.define_method($c.FalseClass, '^', function(args) {
  return $.test(args[0]) ? Qtrue : Qfalse;
});

var Qfalse = $.builtin.Qfalse = {
  klass: $c.FalseClass,  
};