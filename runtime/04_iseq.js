$.define_builtin_class('ISeq', $c.Object);
$.define_method($c.NilClass, 'inspect', function(args) {
  return "nil";
});