$.define_builtin_class('NilClass', $c.Object);
$.define_method($c.NilClass, 'inspect', function(args) {
  return "nil";
});
$.define_method($c.NilClass, '&', function(args) {
  return Qfalse;
});
$.define_method($c.NilClass, '|', function(args) {
  return $.test(args[0]) ? Qtrue : Qfalse;
});
$.define_method($c.NilClass, '^', function(args) {
  return $.test(args[0]) ? Qtrue : Qfalse;
});
$.define_method($c.NilClass, 'nil?', function(args) {
  return Qtrue;
});
$.define_method($c.NilClass, 'to_s', function(args) {
  return "";
});
$.define_method($c.NilClass, 'to_i', function(args) {
  return 0;
});

var Qnil = $.builtin.nil = {
  klass: $c.NilClass,
};