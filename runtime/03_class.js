$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  $c.Module);

$c.Object.constants = $.constants;

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;

$c.Symbol.klass = $c.Class;
$c.Symbol.superklass = $c.Object;

$c.Kernel = $.define_module('Kernel');

$.module_include($c.Object, $c.Kernel);

$.define_method($c.Class, 'allocate', 0, function(self) {
  return {
    klass: self,
    ivs:   {},
  };
});

$.define_method($c.Class, 'new', -1, function(self, args) {
  var object = this.funcall(self, 'allocate');
  this.funcall2(object, 'initialize', args);

  return object;
});

$.define_method($c.Class, 'superclass', 0, function(self) {
  return self.superklass == null ? Qnil : self.superklass;
});

$.define_method($c.BasicObject, 'equal?', 1, function(self, other) {
  return self == other ? Qtrue : Qfalse;
});
$.alias_method($c.BasicObject, '==', 'equal?');

$.define_method($c.BasicObject, '!=', 1, function(self, other) {
  return this.test(this.funcall(self, '==', other)) ? Qfalse : Qtrue;
});

$.define_method($c.BasicObject, '!', 0, function(self) {
  return this.test(self) ? Qfalse : Qtrue;
});
