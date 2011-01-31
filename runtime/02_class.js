$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  null);

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;
$c.Class.superklass = $c.Module;

$.define_method($c.BasicObject, 'equal?', function(args) {
  return this == args[0] ? Qtrue : Qfalse;
});
$.alias_method($c.BasicObject, 'eql?', 'equal?', true);
$.alias_method($c.BasicObject, '==', 'equal?', true);

$.define_method($c.BasicObject, '!', function(args) {
  return $.test(this) ? Qfalse : Qtrue;
});

$.define_method($c.Object, 'nil?', function(args) {
  $.check_args(args, 0);
  return Qfalse;
});
$.define_method($c.Object, 'to_s', function(args) {
  $.check_args(args, 0);
  return "#<" + this.klass.klass_name + ">";
});
$.alias_method($c.Object, 'inspect', 'to_s');

$.define_method($c.Module, 'name', function(args) {
  $.check_args(args, 0);
  return this.klass_name;
});
$.alias_method($c.Module, 'to_s', 'name', true);
