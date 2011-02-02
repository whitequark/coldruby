$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  null);

$c.Object.constants = $.constants;

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;
$c.Class.superklass = $c.Module;

$c.Symbol.klass = $c.Class;
$c.Symbol.superklass = $c.Object;

$.define_method($c.BasicObject, 'equal?', 1, function(self, other) {
  return self == other ? Qtrue : Qfalse;
});
$.alias_method($c.BasicObject, 'eql?', 'equal?');
$.alias_method($c.BasicObject, '==', 'equal?');

$.define_method($c.BasicObject, '!', 0, function(self) {
  return $.test(self) ? Qfalse : Qtrue;
});

$.define_method($c.Module, 'name', 0, function(self) {
  return self.klass_name;
});
$.alias_method($c.Module, 'to_s', 'name');

$.define_method($c.Module, 'const_get', -1, function(self, args) {
  $.check_args(args, 1, 1);
  var name    = $.check_convert_type(this, args[0], $c.Symbol, 'to_sym');
  var inherit = $.test(args[1] || Qtrue);
  return $.const_get(self, name, inherit);
});

$.define_method($c.Module, 'const_defined?', -1, function(self, args) {
  $.check_args(args, 1, 1);
  var name    = $.check_convert_type(this, args[0], $c.Symbol, 'to_sym');
  var inherit = $.test(args[1] || Qtrue);
  return $.const_defined(self, name, inherit) ? Qtrue : Qfalse;
});

$.define_method($c.Module, 'const_set', 2, function(self, name, value) {
  var name = $.check_convert_type(this, name, $c.Symbol, 'to_sym');
  return $.const_set(self, name, value);
});

$.define_method($c.Module, 'constants', -1, function(self, args) {
  $.check_args(args, 0, 1);
  var inherit = $.test(args[1] || Qtrue);

  var constants = [];
  for(var name in self.constants)
    constants.push($.id2sym(name));
  return constants;
});
