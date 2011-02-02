var $ = {
  constants: {},
  internal_constants: {}, // analogue of rb_c*
  globals: {},
  globals_aliases: {},
  builtin: {
    setup: function() {
      $.gvar_set('$"', []);
      $.gvar_alias('$LOADED_FEATURES', '$"');

      $.gvar_set('$:', []);
      $.gvar_alias('$LOAD_PATH', '$:');
    },

    allocate: function(self) {
      return {
        klass:            self,
        ivs:              {},
      };
    },
    'new': function(self, args) {
      var object = this.ruby.builtin.allocate(self);
      $.invoke_method(this, object, 'initialize', args);
      return object;
    },
  },

  /* === GLOBAL VARIABLES === */
  gvar_normalize: function(name) {
    name = this.any2id(name);
    if(name in this.globals_aliases) {
      name = this.globals_aliases[name];
    }
    return name;
  },

  /*
   * call-seq: -> Boolean
   * Check if a global variable +name+ is defined.
   */
  gvar_defined: function(name) {
    name = this.any2id(name);
    return name in this.globals || name in this.globals_aliases;
  },

  /*
   * Set an alias +name+ for global variable +other_name+.
   */
  gvar_alias: function(name, other_name) {
    name = this.any2id(name);
    this.globals_aliases[name] = this.gvar_normalize(other_name);
  },

  /*
   * Retrieve contents of global variable +name+.
   */
  gvar_get: function(name) {
    return this.globals[this.gvar_normalize(name)] || this.builtin.Qnil;
  },

  /*
   * Set contents of global variable +name+ to +value+.
   */
  gvar_set: function(name, value) {
    this.globals[this.gvar_normalize(name)] = value;
  },

  /* === CONSTANTS === */
  const_defined: function(scope, name, inherit) {
    if(scope == this.builtin.Qnil) scope = this;
    name = $.any2id(name);

    return (name in scope.constants);
  },

  const_get: function(scope, name, inherit) {
    if(scope == this.builtin.Qnil) scope = this;
    name = $.any2id(name);

    if(scope.constants[name] == undefined) {
      throw "constant " + this.id2text(name) + " is undefined";
    }

    return scope.constants[name];
  },

  const_set: function(scope, name, value) {
    if(scope == this.builtin.Qnil) scope = this;
    name = $.any2id(name);

    if(scope.constants[name] != undefined) {
      throw "constant " + this.id2text(name) + " is already defined";
    }

    scope.constants[name] = value;

    return value;
  },

  /* === CLASSES AND MODULES === */
  define_module: function(name, self_klass, superklass) {
    var klass = {
      klass_name:        name,
      klass:             self_klass || this.internal_constants.Module,
      superklass:        superklass || this.internal_constants.Object,
      constants:         {},
      instance_methods:  {},
      singleton_methods: {},
      ivs:               {},
    };
    this.constants[this.any2id(name)] = klass;
    this.internal_constants[name]     = klass;
    return klass;
  },

  define_class: function(name, superklass) {
    var klass = this.define_module(name, this.internal_constants.Class, superklass);
    klass.singleton_methods[this.any2id('allocate')] = this.builtin['allocate'];
    klass.singleton_methods[this.any2id('new')]      = this.builtin['new'];
    return klass;
  },

  module_include: function(target, module) {
    if(target.included_modules == undefined) {
      target.included_modules = [];
    }
    target.included_modules.push(module);
  },

  wrap_method: function(want_args, method) {
    var ruby = this, wrapper;

    if(typeof method != 'function' &&
         method.klass == this.internal_constants.InstructionSequence) {
      return method;
    }

    if(want_args >= 0) {
      wrapper = function(self, args) {
        ruby.check_args(args, want_args);
        args.unshift(self);
        return method.apply(this, args);
      };
    } else if(want_args == -1) {
      wrapper = method;
    } else {
      throw "wrap_method: unknown want_args type " + want_args;
    }

    return wrapper;
  },

  define_method: function(klass, name, want_args, method) {
    name = $.any2id(name);

    klass.instance_methods[name] = this.wrap_method(want_args, method);
  },

  define_singleton_method: function(klass, name, want_args, method) {
    name = $.any2id(name);

    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = this.wrap_method(want_args, method);
  },

  alias_method: function(klass, name, other_name) {
    name       = $.any2id(name);
    other_name = $.any2id(other_name);

    klass.instance_methods[name] = $.find_method(klass, other_name, true);
  },

  attr: function(type, klass, methods) {
    var ruby = this;
    if(typeof methods == 'string') {
      methods = [methods];
    }

    for(var i = 0; i < methods.length; i++) {
      var method = methods[i];
      if(type == 'reader' || type == 'accessor') {
        this.define_method(klass, method, 0, function(self) {
          return self.iv[method] || ruby.builtin.Qnil;
        });
      }
      if(type == 'writer' || type == 'accessor') {
        if(method.klass == this.internal_constants.Symbol) {
          method = this.id2text(method.value);
        }
        this.define_method(klass, method + '=', 0, function(self) {
          return self.iv[method] || ruby.builtin.Qnil;
        });
      }
    }
  },

  find_method: function(object, method, search_klass) {
    var func = null;

    if(object != null) {
      // Search singleton methods, and then class hierarchy
      if(!search_klass) {
        if(object.singleton_methods != null) {
          func = object.singleton_methods[method];
        }
      }

      var klass = search_klass ? object : object.klass;
      while(func == null && klass != null) {
        if(!search_klass && klass.included_modules) {
          for(var i = 0; i < klass.included_modules.length && func == null; i++) {
            func = klass.included_modules[i].instance_methods[method];
          }
        }

        if(func == null && klass.instance_methods) {
          func = klass.instance_methods[method];
        }

        klass = klass.superklass;
      }
    }

    return func;
  },

  obj_infect: function(object, source) {
    // implement tainting here
  },

  test: function(object) {
    return !(object == this.builtin.Qnil || object == this.builtin.Qfalse);
  },

  respond_to: function(object, method) {
    return find_method(object, method) != null;
  },

  check_args: function(args, count) {
    if(args.length != count) {
      throw "wrong argument count: " + args.length + " != " + count;
    }
  },

  check_type: function(arg, type) {
    if(type instanceof Array) {
      for(var i = 0; i < type.length; i++) {
        if(arg.klass == type[i]) return arg;
      }
      throw "type mismatch: " + arg.klass.klass_name + " is not expected";
    } else {
      if(arg.klass != type) {
        throw "type mismatch: " + arg.klass.klass_name + " != " + type.klass_name;
      }
      return arg;
    }
  },

  check_convert_type: function(ctx, arg, type, converter) {
    if(arg.klass != type) {
      return $.invoke_method(ctx, arg, converter, []);
    } else {
      return arg;
    }
  },

  execute_class: function(ctx, cbase, name, superklass, is_class, iseq) {
    if(name != null) {
      if(!this.const_defined(cbase, name)) {
        if(superklass.singleton) {
          throw "can't make subclass of singleton";
        }

        var klass = {
          klass_name:        name,
          klass:             is_class ? this.internal_constants.Class : this.internal_constants.Module,
          superklass:        superklass == this.builtin.Qnil ? this.internal_constants.Object : superklass,
          constants:         {},
          instance_methods:  {},
          singleton_methods: {},
          ivs:               {},
        };
        klass.singleton_methods[this.any2id('allocate')] = this.builtin['allocate'];
        klass.singleton_methods[this.any2id('new')]      = this.builtin['new'];
        this.const_set(cbase, name, klass);
      } else {
        var klass = this.const_get(cbase, name);
      }
    } else { // singleton
      if(!cbase.singleton_methods) {
        cbase.singleton_methods = {}
      }

      var klass = {
        klass_name:        'singleton',
        klass:             this.internal_constants.Class,
        superklass:        this.internal_constants.Object,
        constants:         {},
        instance_methods:  cbase.singleton_methods,
        singleton_methods: {},
        ivs:               {},
        singleton:         true,
      }
    }

    var cref = [ klass ];
    for(var i = 0; i < ctx.sf.cref.length; i++) {
      cref.push(ctx.sf.cref[i]);
    }

    var sf_opts = {
      self: klass,
      ddef: klass,
      cref: cref,
    };

    return $.execute(ctx, sf_opts, iseq, []);
  },

  invoke_method: function(ctx, receiver, method, args, block) {
    method = this.any2id(method);

    func = this.find_method(receiver, method);

    var sf_opts = {
      block: block,

      self: receiver,
      ddef: ctx.sf.ddef,
      cref: ctx.sf.cref,
    };

    var retval;
    if(func == undefined) {
      throw "cannot find method " + this.id2text(method);
    } else {
      return $.execute(ctx, sf_opts, func, args);
    }
  },

  block_given: function(ctx) {
    return !!ctx.sf.block;
  },

  yield: function(ctx, args, iseq) {
    var iseq = ctx.sf.block;

    if(!iseq) {
      throw "block is needed";
    }

    var sf = iseq.stack_frame;

    var sf_opts = {
      self: sf.self,
      ddef: sf.ddef,
      cref: sf.cref,

      outer: sf,
    };

    return this.execute(ctx, sf_opts, iseq, args)
  },

  execute: function(ctx, opts, iseq, args) {
    var new_sf = {
      parent:  ctx.sf,

      stack:   [],
      sp:      0,
      locals:  [],
      dynamic: [],
      osf:     null,

      // http://yugui.jp/articles/846
      self: null,
      ddef: null,
      cref: null,
    };

    for(var key in opts) {
      new_sf[key] = opts[key];
    }

/*  if(typeof iseq == 'object') {
      var method = iseq.info.func;
    } else {
      var method = '!native';
    }
    this.ps(ctx, new_sf.self.klass.klass_name + '#' + method + ' in ' + new_sf.self);
*/

    if(typeof iseq == 'object') {
      if(args.length < iseq.info.args.argc && (iseq.info.type == 'method' || iseq.lambda)) {
        throw "argument count mismatch: " + args.length + " < " + iseq.info.args.argc;
      }

      var argsinfo = iseq.info.args;
      var new_args = [];

      if(argsinfo.block > -1) {
        if(new_sf.block) {
          new_args[argsinfo.block] = this.builtin.make_proc(new_sf.block);
        } else {
          new_args[argsinfo.block] = this.builtin.Qnil;
        }
      }
      for(var i = 0; i < argsinfo.argc; i++) {
        new_args[i] = args.shift();
      }
      if(argsinfo.rest > -1) {
        new_args[argsinfo.rest] = args;
        args = [];
      }

      if(args.length > 0) {
        throw "[internal] incorrect argument exploding"
      }

      for(var i = 0; i < iseq.info.arg_size; i++) {
        new_sf.locals[2 + i] = new_args[iseq.info.arg_size - i - 1] || this.builtin.Qnil;
      }
    }

    new_sf.dynamic.push(new_sf);
    if(new_sf.outer) {
      for(var i = 0; i < new_sf.outer.dynamic.length; i++) {
        new_sf.dynamic.push(new_sf.outer.dynamic[i]);
      }

      new_sf.osf = ctx.sf;
    } else {
      new_sf.osf = new_sf;
    }

    ctx.sf = new_sf;

    if(typeof iseq == 'object') {
      var chunk = 0;
      while(chunk != null) {
        chunk = iseq[chunk].call(ctx);
      }

      if(new_sf.sp != 1) {
        throw "Invalid stack frame at exit"
      }

      var retval = new_sf.stack[0];
    } else {
      var retval = iseq.call(ctx, new_sf.self, args);
    }

    ctx.sf = new_sf.parent;

    return retval;
  },

  create_toplevel: function() {
    var toplevel = {
      klass: this.internal_constants.Object,
      singleton_methods: {},
      ivs: {},
      toplevel: true
    };
    this.define_singleton_method(toplevel, 'inspect', 0, function(self) {
      return "main";
    });
    return toplevel;
  },

  create_context: function() {
    return {
      ruby: this,
      sf:   null,
      osf:  null,
    };
  },

  ps: function(ctx, where) {
    print("> Stack Frame ("+where+") <");
    pp(ctx.sf)
  }
};

var $c = $.internal_constants;