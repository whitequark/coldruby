var $ = {
  constants: {},
  internal_constants: {}, // analogue of rb_c*
  c: null,
  e: null,
  globals: {},
  globals_aliases: {},
  builtin: {
    setup: function() {
      $.gvar_set('$"', []);
      $.gvar_alias('$LOADED_FEATURES', '$"');

      $.gvar_set('$:', ['./stdlib']);
      $.gvar_alias('$LOAD_PATH', '$:');

      $.e = $.c = $.internal_constants;
    },

    allocate: function(self) {
      return {
        klass:            self,
        ivs:              {},
      };
    },
    'new': function(self, args) {
      var object = this.builtin.allocate(self);
      this.funcall2(object, 'initialize', args);
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
  const_find_scope: function(name) {
    var cref = this.context.sf.cref;

    // Skip outermost context; it has precedence lower than superklasses
    for(var i = 0; i < cref.length - 1; i++) {
      if(name in cref[i].constants)
        return cref[i];
    }

    var klass = cref[0];
    while(klass) {
      if(name in klass.constants)
        return klass;
      klass = klass.superklass;
    }

    // Return the inner scope. It does not really matter what to
    // return, as the constant won't be found anyway.
    return cref[0];
  },

  const_defined: function(scope, name, inherit) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.const_find_scope(name);

    return (name in scope.constants);
  },

  const_get: function(scope, name, inherit) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.const_find_scope(name);

    if(scope.constants[name] == undefined) {
      this.raise2(this.e.NameError, ["uninitialized constant " +
          scope.klass_name + '::' + this.id2text(name), this.id2sym(name)]);
    }

    return scope.constants[name];
  },

  const_set: function(scope, name, value) {
    if(scope == this.builtin.Qnil) scope = this;
    name = this.any2id(name);

    if(scope.constants[name] != undefined) {
      var strname = this.id2text(name);
      // TODO warn
      //this.raise2(this.e.NameError, ["Constant " + strname + " is already defined", strname]);
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

  wrap_method: function(name, want_args, method) {
    var wrapper;

    if(typeof method != 'function') {
      if(method.klass == this.c.InstructionSequence) {
        return method;
      } else {
        throw "wrap_method: invalid object";
      }
    }

    if(want_args >= 0) {
      wrapper = function(self, args) {
        this.check_args(args, want_args);
        args.unshift(self);
        return method.apply(this, args);
      };
    } else if(want_args == -1) {
      wrapper = method;
    } else {
      throw "wrap_method: unknown want_args type " + want_args;
    }

    method.info = {
      type: 'method',

      path: '<native>',
      file: '<native>',
      line: 0,
      func: this.id2text(name),
    };

    return wrapper;
  },

  define_method: function(klass, name, want_args, method) {
    name = this.any2id(name);

    klass.instance_methods[name] = this.wrap_method(name, want_args, method);
  },

  define_singleton_method: function(klass, name, want_args, method) {
    name = this.any2id(name);

    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = this.wrap_method(name, want_args, method);
  },

  alias_method: function(klass, name, other_name) {
    name       = this.any2id(name);
    other_name = this.any2id(other_name);

    klass.instance_methods[name] = this.find_method(klass, other_name, true);
  },

  attr: function(type, klass, methods) {
    var ruby = this;
    if(typeof methods == 'string') {
      methods = [methods];
    }

    for(var i = 0; i < methods.length; i++) {
      var method = this.any2id(methods[i]), v = '@' + this.id2text(method);
      if(type == 'reader' || type == 'accessor') {
        this.define_method(klass, method, 0, function(self) {
          return self.ivs[v] || ruby.builtin.Qnil;
        });
      }
      if(type == 'writer' || type == 'accessor') {
        this.define_method(klass, this.id2text(method) + '=', 1, function(self, value) {
          self.ivs[v] = value;
          return value;
        });
      }
    }
  },

  find_method: function(object, method, search_klass) {
    var func = null;

    if(object != null) {
      // Search singleton methods, and then class hierarchy
      if(!search_klass) {
        var singleton = object;
        while(func == null && singleton != null) {
          if(singleton.singleton_methods != null) {
            func = singleton.singleton_methods[method];
          }
          singleton = singleton.superklass;
        }
      }

      var klass = search_klass ? object : object.klass;
      while(func == null && klass != null) {
        if(klass.included_modules) {
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

  check_args: function(args, req, opt) {
    opt = opt || 0;
    if(args.length < req || args.length > req + opt) {
      if(opt == 0) {
        this.raise(this.e.ArgumentError, "Wrong argument count: " + args.length +
            " is not " + req);
      } else {
        this.raise(this.e.ArgumentError, "Wrong argument count: " + args.length +
            " not in " + req + '..' + (req+opt));
      }
    }
  },

  check_type: function(arg, type) {
    if(type instanceof Array) {
      for(var i = 0; i < type.length; i++) {
        if(arg.klass == type[i]) return arg;
      }
      this.raise(this.e.TypeError, "Type mismatch: " + arg.klass.klass_name + " is not expected");
    } else {
      if(arg.klass != type) {
        this.raise(this.e.TypeError, "Type mismatch: " + arg.klass.klass_name + " is not " + type.klass_name);
      }
      return arg;
    }
  },

  check_convert_type: function(arg, type, converter) {
    if(arg.klass != type) {
      return this.funcall(arg, converter);
    } else {
      return arg;
    }
  },

  raise: function(template, message, backtrace, skip) {
    var args = (message != undefined) ? [message] : [];
    if(typeof template == 'string') {
      var exception = this.funcall2(this.internal_constants.RuntimeError, 'new', [template]);
    } else {
      var exception = this.funcall2(template, 'exception', args);
    }
    if(!backtrace) {
      backtrace = [];

      var sf = this.context.sf;
      while(sf) {
        if(sf.iseq.info) { // YARV bytecode
          backtrace.push(sf.iseq.info.file + ':' + (sf.line || sf.iseq.info.line) +
              ': in `' + sf.iseq.info.func + '\'');
        } else {
          backtrace.push('unknown:0: in `<native:unknown>\'');
        }
        sf = sf.parent;
      }
    }
    if(skip) {
      backtrace = backtrace.slice(skip);
    }
    this.funcall(exception, 'set_backtrace', backtrace);

    throw exception;
  },

  raise2: function(klass, args, backtrace, skip) {
    var exception = this.funcall2(klass, 'exception', args);
    this.raise(exception, undefined, backtrace, skip);
  },

  protect: function(code, rescue) {
    try {
      return code.call(this);
    } catch(e) {
      return rescue.call(this, e);
    }
  },

  execute_class: function(cbase, name, superklass, is_class, iseq) {
    if(name != null) {
      if(!this.const_defined(cbase, name)) {
        if(superklass.singleton) {
          this.raise(this.e.TypeError, "can't make subclass of singleton class");
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
    for(var i = 0; i < this.context.sf.cref.length; i++) {
      cref.push(this.context.sf.cref[i]);
    }

    var sf_opts = {
      self: klass,
      ddef: klass,
      cref: cref,
    };

    return this.execute(sf_opts, iseq, []);
  },

  funcall: function(receiver, method) {
    var args_array = [];
    for(var i = 2; i < arguments.length; i++) {
      args_array.push(arguments[i]);
    }
    return this.funcall2(receiver, method, args_array);
  },

  funcall2: function(receiver, method, args, block) {
    method = this.any2id(method);

    func = this.find_method(receiver, method);

    var sf_opts = {
      block: block,

      self: receiver,
      ddef: this.context.sf.ddef,
      cref: this.context.sf.cref,
    };

    var retval;
    if(func == undefined) {
      this.raise2(this.internal_constants.NameError,
            ["undefined local variable or method " + this.id2text(method),
             this.id2sym(method)]);
    } else {
      return this.execute(sf_opts, func, args);
    }
  },

  block_given: function() {
    return !!this.context.sf.block;
  },

  yield: function() {
    return this.yield2(arguments);
  },

  yield2: function(args) {
    var iseq = this.context.sf.block;

    if(!iseq) {
      this.raise(this.e.LocalJumpError, "no block given (yield)");
    }

    var sf = iseq.stack_frame;

    var sf_opts = {
      self: sf.self,
      ddef: sf.ddef,
      cref: sf.cref,

      outer: sf,
    };

    return this.execute(sf_opts, iseq, args);
  },

  execute: function(opts, iseq, args) {
    var new_sf = {
      parent:  this.context.sf,

      stack:   [],
      sp:      0,
      locals:  [],
      dynamic: [],
      osf:     null,

      // http://yugui.jp/articles/846
      self: null,
      ddef: null,
      cref: null,

      iseq: iseq,
      line: null,
    };

    for(var key in opts) {
      new_sf[key] = opts[key];
    }

/*    if(typeof iseq == 'object') {
      var method = iseq.info.func;
    } else {
      var method = '!native';
    }
    this.ps(ctx, new_sf.self.klass.klass_name + '#' + method + ' in ' + new_sf.self);*/

    if(!(args instanceof Array)) { // `arguments' internal isn't array
      var old_args = args;
      args = [];
      for(var i = 0; i < old_args.length; i++) {
        args.push(old_args[i]);
      }
    }

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
        new_args[i] = args[i];
      }
      args = args.splice(argsinfo.argc);
      if(argsinfo.rest > -1) {
        new_args[argsinfo.rest] = args;
        args = [];
      }

      if(args.length > 0) {
        throw "[internal] incorrect argument exploding"
      }

      for(var i = 0; i < iseq.info.arg_size; i++) {
        new_sf.locals[iseq.info.local_size - i] = new_args[i] || this.builtin.Qnil;
      }
    }

    new_sf.dynamic.push(new_sf);
    if(new_sf.outer) {
      for(var i = 0; i < new_sf.outer.dynamic.length; i++) {
        new_sf.dynamic.push(new_sf.outer.dynamic[i]);
      }

      new_sf.osf = this.context.sf;
    } else {
      new_sf.osf = new_sf;
    }

    this.context.sf = new_sf;

    if(typeof iseq == 'object') {
      var chunk = 0;
      while(chunk != null) {
        chunk = iseq[chunk].call(this);
      }

      if(new_sf.sp != 1) {
        throw "Invalid stack frame at exit"
      }

      var retval = new_sf.stack[0];
    } else {
      var retval = iseq.call(this, new_sf.self, args);
    }

    this.context.sf = new_sf.parent;

    return retval;
  },

  create_toplevel: function() {
    var toplevel = {
      klass: this.internal_constants.Object,
      singleton_methods: {},
      ivs: {},
      toplevel: true
    };
    this.define_singleton_method(toplevel, 'to_s', 0, function(self) {
      return "main";
    });
    return toplevel;
  },

  create_ruby: function() {
    return {
      __proto__: this,
      context: {
        sf:        null,
        osf:       null,
      }
    };
  },

  ps: function(ctx, where) {
    $i.print("> Stack Frame ("+where+") <");
    pp(ctx.sf)
  }
};

var $c = $.internal_constants, $e = $c;