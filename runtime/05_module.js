$.define_singleton_method($c.Module, 'new', 0, function(self) {
  var sf = this.context.sf;

  var klass = {
    klass:             this.internal_constants.Module,
    singleton_klass:   null,
    constants:         {},
    class_variables:   {},
    instance_methods:  {},
    ivs:               {},
    toString:          function() { return "#<Module: " + $.class2name(this) + ">"; }
  };

  var cref = [ klass ];
  for(var i = 0; i < sf.block.stack_frame.cref.length; i++) {
    cref.push(sf.block.stack_frame.cref[i]);
  }

  var sf_opts = {
    self: klass,
    ddef: klass,
    cref: cref,

    outer: sf.block.stack_frame
  };

  this.execute(sf_opts, sf.block, [ klass ]);

  return klass;
});

$.define_method($c.Module, 'name', 0, function(self) {
  if(self.type == 'singleton') {
    var object = this.funcall(self.object, 'to_s').value;
    return this.string_new("#<Class:" + object + ">");
  } else {
    return this.string_new(this.class2name(self));
  }
});
$.alias_method($c.Module, 'to_s', 'name');

$.define_method($c.Module, 'ancestors', 0, function(self) {
  var ancestors = [], klass = self;

  while(klass) {
    if(klass.type == 'module_proxy') {
      ancestors.push(klass.klass);
    } else {
      ancestors.push(klass);
    }

    klass = klass.superklass;
  }

  return ancestors;
});

$.define_method($c.Module, 'included_modules', 0, function(self) {
  var modules = [], klass = self;

  while(klass) {
    if(klass.type == 'module_proxy')
      modules.push(klass.klass);

    klass = klass.superklass;
  }
  return modules;
});

$.define_method($c.Module, 'include?', 1, function(self, module) {
  klass = self.superklass;
  while(klass) {
    if((klass.type == 'module_proxy' && klass.klass == module) ||
        klass == module) {
      return Qtrue;
    }

    klass = klass.superklass;
  }

  return Qfalse;
});

$.define_method($c.Module, '===', 1, function(self, obj) {
  return this.obj_is_kind_of(obj, self) ? Qtrue : Qfalse;
});

$.define_method($c.Module, 'define_method', -1, function(self, args) {
  this.check_args(args, 1, 1);

  var name = args[0], method = args[1];
  this.check_type(name, [$c.String, $c.Symbol]);

  if(!method) {
    method = this.block_proc();
  } else {
    this.check_type(method, $c.Proc);
  }

  $.define_method(self, $.any2id(name), 0, method.iseq);

  return method;
});

var with_each_method = function(what, type, include_super, f) {
  include_super = $.test(include_super || Qtrue);

  var object = what;
  while(object) {
    for(var id in object.instance_methods) {
      var method = object.instance_methods[id];
      if(method.visibility == type) {
        f($.id2sym(id));
      }
    }

    if(!include_super) break;

    object = object.superklass;
  }
}

var make_reflectors = function(type) {
  $.define_method($c.Kernel, type, -1, function(self, args) {
    // stub

    return Qnil;
  });

  var visibility = (type == 'public' ? null : type);

  $.define_method($c.Kernel, type+'_method_defined?', 1, function(self, method) {
    return $.find_method(self, $.any2id(method)) ? Qtrue : Qfalse;
  });


  $.define_method($c.Kernel, type+'_methods', -1, function(self, args) {
    this.check_args(args, 0, 1);

    var methods = [];
    with_each_method(self.singleton_klass, visibility, args[0], function(method) {
      methods.push(method);
    });
    with_each_method(self.klass, visibility, args[0], function(method) {
      methods.push(method);
    });
    return this.funcall(methods, 'uniq!');
  });

  $.define_method($c.Module, type+'_instance_methods', -1, function(self, args) {
    this.check_args(args, 0, 1);

    var methods = [];
    with_each_method(self, visibility, args[0], function(method) {
      methods.push(method);
    });
    return this.funcall(methods, 'uniq!');
  });
};

var types = ['public', 'private', 'protected'];
for(var i = 0; i < types.length; i++) {
  make_reflectors(types[i]);
}

$.alias_method($c.Kernel, 'method_defined?', 'public_method_defined?');
$.alias_method($c.Kernel, 'methods', 'public_methods');
$.alias_method($c.Module, 'instance_methods', 'public_instance_methods');

$.define_method($c.Module, 'module_function', -1, function(self, args) {
  var singleton = this.get_singleton(self);

  for(var i = 0; i < args.length; i++) {
    var name = $.any2id(args[i]);
    singleton.instance_methods[name] = self.instance_methods[name];
  }

  return Qnil;
});

$.define_method($c.Module, 'private_class_method', -1, function(self, args) {
  // stub

  return Qnil;
});

$.define_method($c.Module, 'extend_object', 1, function(self, object) {
  $.module_include(this.get_singleton(object), self);

  this.funcall(self, 'extended', object);

  return Qnil;
});

/* === PRIVATE === */

$.visibility($c.Module, 'private');

$.define_method($c.Module, 'extended', 1, function(self, where) {
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
  var name    = this.to_sym(args[0]);
  var inherit = $.test(args[1] || Qtrue);
  return this.const_get(self, name, inherit);
});

$.define_method($c.Module, 'const_defined?', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var name    = this.to_sym(args[0]);
  var inherit = $.test(args[1] || Qtrue);
  return this.const_defined(self, name, inherit) ? Qtrue : Qfalse;
});

$.define_method($c.Module, 'const_missing', 1, function(self, name) {
  name = this.check_type(name, $c.Symbol);

  var autoload = $c.Kernel.autoload[name.value];
  if(autoload) {
    this.funcall(self, 'require', autoload);
    return this.const_get(self, name);
  }

  this.raise2(this.e.NameError,
      [this.string_new("uninitialized constant " +
       this.class2name(self) + '::' + this.id2text(name.value)), name], undefined, 1);
});

$.define_method($c.Module, 'const_set', 2, function(self, name, value) {
  var name = this.to_sym(name);
  return this.const_set(self, name, value);
});

$.define_method($c.Module, 'remove_const', 1, function(self, name) {
  name = this.to_sym(name);
  this.const_remove(self, name);
  return Qnil;
});

$.define_method($c.Module, 'constants', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var inherit = this.test(args[1] || Qtrue);

  var constants = [];
  for(var name in self.constants)
    constants.push($.id2sym(name));
  return constants;
});

$.define_method($c.Module, 'class_variable_get', 1, function(self, name) {
  name = this.to_sym(name);
  return this.cvar_get(self, name);
});

$.define_method($c.Module, 'class_variable_defined?', 1, function(self, name) {
  name = this.to_sym(name);
  return this.cvar_defined(self, name) ? Qtrue : Qfalse;
});

$.define_method($c.Module, 'class_variable_set', 2, function(self, name, value) {
  name = this.to_sym(name);
  return this.cvar_set(self, name, value);
});

$.define_method($c.Module, 'remove_class_variable', 1, function(self, name) {
  name = this.to_sym(name);
  this.cvar_remove(self, name);
  return Qnil;
});

$.define_method($c.Module, 'class_variables', 0, function(self) {
  var cvars = [];
  for(var name in self.class_variables)
    cvars.push($.id2sym(name));
  return cvars;
});
