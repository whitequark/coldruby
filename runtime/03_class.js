$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  null);

$c.Object.constants = $.constants;

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;
$c.Class.superklass = $c.Module;

$c.Symbol.klass = $c.Class;
$c.Symbol.superklass = $c.Object;

$.define_method($c.Class, 'allocate', 0, function(self) {
  return {
    klass: self,
    ivs:   {},
  };
});

$.define_method($c.Class, 'new', -1, function(self, args) {
  var object = {
    klass: self,
    ivs:   {},
  };

  this.funcall2(object, 'initialize', args);

  return object;
});

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

$.define_method($c.Module, 'include', 1, function(self, module) {
  $.module_include(self, module);
  return Qnil;
});

$.define_method($c.Module, 'module_function', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    var name = $.any2id(args[i]);
    self.singleton_methods[name] = self.instance_methods[name];
  }
  return Qnil;
});

$.define_method($c.Module, 'attr_reader', -1, function(self, args) {
  $.attr('reader', self, args);
  return Qnil;
});
$.alias_method($c.Module, 'attr', 'attr_reader')

$.define_method($c.Module, 'attr_writer', -1, function(self, args) {
  $.attr('writer', self, args);
  return Qnil;
});

$.define_method($c.Module, 'attr_accessor', -1, function(self, args) {
  $.attr('accessor', self, args);
  return Qnil;
});

$.define_method($c.Module, 'const_get', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var name    = this.check_convert_type(args[0], $c.Symbol, 'to_sym');
  var inherit = $.test(args[1] || Qtrue);
  return $.const_get(self, name, inherit);
});

$.define_method($c.Module, 'const_defined?', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var name    = this.check_convert_type(args[0], $c.Symbol, 'to_sym');
  var inherit = $.test(args[1] || Qtrue);
  return $.const_defined(self, name, inherit) ? Qtrue : Qfalse;
});

$.define_method($c.Module, 'const_set', 2, function(self, name, value) {
  var name = this.check_convert_type(name, $c.Symbol, 'to_sym');
  return this.const_set(self, name, value);
});

$.define_method($c.Module, 'constants', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var inherit = this.test(args[1] || Qtrue);

  var constants = [];
  for(var name in self.constants)
    constants.push($.id2sym(name));
  return constants;
});
