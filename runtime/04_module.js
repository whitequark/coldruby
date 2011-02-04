$.define_method($c.Module, 'name', 0, function(self) {
  return self.klass_name;
});
$.alias_method($c.Module, 'to_s', 'name');

$.define_method($c.Module, 'ancestors', 0, function(self) {
  var ancestors = [], klass = self;
  while(klass) {
    ancestors.push(klass.real_module || klass);
    klass = klass.parentklass;
  }
  return ancestors;
});

$.define_method($c.Module, 'included_modules', 0, function(self) {
  var ancestors = [], klass = self;
  while(klass) {
    if(klass.real_module)
      ancestors.push(klass.real_module);
    klass = klass.parentklass;
  }
  return ancestors;
});

$.define_method($c.Module, 'include?', 1, function(self, module) {
  klass = self.parentklass;
  while(klass) {
    if(klass == module || klass.real_module == module)
      return Qtrue;
    klass = klass.parentklass;
  }

  return Qfalse;
});

$.define_method($c.Module, 'module_function', -1, function(self, args) {
  for(var i = 0; i < args.length; i++) {
    var name = $.any2id(args[i]);
    self.singleton_methods[name] = self.instance_methods[name];
  }
  return Qnil;
});

$.define_method($c.Module, 'include', 1, function(self, module) {
  this.check_type(module, $c.Module);
  $.module_include(self, module);
  this.funcall(module, 'included', self);
  return Qnil;
});

$.define_method($c.Module, 'included', 1, function(self, where) {
  return Qnil;
});

$.define_method($c.Module, 'alias_method', 2, function(self, alias, method) {
  this.alias_method(self, alias, method);
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
