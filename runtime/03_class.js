$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  null);

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;
$c.Class.superklass = $c.Module;

$c.Symbol.klass = $c.Class;
$c.Symbol.superklass = $c.Object;

$.define_method($c.BasicObject, 'equal?', 1, function(self, other) {
  return self == other ? Qtrue : Qfalse;
});
$.alias_method($c.BasicObject, 'eql?', 'equal?', true);
$.alias_method($c.BasicObject, '==', 'equal?', true);

$.define_method($c.BasicObject, '!', 0, function(self) {
  return $.test(self) ? Qfalse : Qtrue;
});

$.define_method($c.Module, 'name', 0, function(self) {
  return self.klass_name;
});
$.alias_method($c.Module, 'to_s', 'name', true);
