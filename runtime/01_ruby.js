var $ = {
  builtin: {
    setup: function() {
      $.gvar_set('$"', []);
      $.gvar_alias('$LOADED_FEATURES', '$"');

      $.gvar_set('$:', []);
      $.gvar_alias('$LOAD_PATH', '$:');

      $.gvar_set('$,', "");
      $.gvar_set('$_', $.builtin.Qnil);

      $.e = $.c = $.internal_constants;
    },
  },

  /* === GLOBAL VARIABLES === */
  globals: {},
  globals_aliases: {},
  specials: {},

  /*
   * call-seq: gvar_normalize(name) -> string
   *
   * Normalize a global variable name by expanding all aliases.
   */
  gvar_normalize: function(name) {
    name = this.any2id(name);
    if(name in this.globals_aliases) {
      name = this.globals_aliases[name];
    }
    return name;
  },

  /*
   * call-seq: gvar_defined(name) -> true or false
   *
   * Check if a global variable +name+ is defined.
   */
  gvar_defined: function(name) {
    name = this.any2id(name);
    return name in this.globals || name in this.globals_aliases;
  },

  /*
   * call-seq: gvar_alias(name, other) -> null
   *
   * Set an alias +name+ for global variable +other_name+.
   */
  gvar_alias: function(name, other_name) {
    name = this.any2id(name);
    this.globals_aliases[name] = this.gvar_normalize(other_name);
  },

  /*
   * call-seq: gvar_get(name) -> value or Qnil
   *
   * Retrieve contents of global variable +name+ or nil if it does not exist.
   */
  gvar_get: function(name) {
    name = this.gvar_normalize(name);

    var v = this.specials[name];
    if(v) return v.get.apply(this);

    var v = this.globals[name];
    return v == null ? this.builtin.Qnil : v;
  },

  /*
   * call-seq: gvar_set(name, value) -> value
   *
   * Set contents of global variable +name+ to +value+.
   */
  gvar_set: function(name, value) {
    name = this.gvar_normalize(name);

    var v = this.specials[name];
    if(v) return v.set.apply(this, value);

    this.globals[name] = value;
    return value;
  },

  /*
   * call-seq: gvar_special(name, { get: <getter> [, set: <setter> ] }) -> null
   *
   * Define a special global variable.
   */
  gvar_special: function(name, data) {
    this.specials[this.any2id(name)] = data;
  },

  /* === CONSTANTS === */
  constants: {},
  internal_constants: {}, // analogue of rb_c*
  c: null,
  e: null,

  /*
   * call-seq: const_find_scope(name) -> module instance
   *
   * Find a scope in which constant +name+ is defined, starting from the
   * innermost stack frame.
   * TODO: check the search rules (comparing to MRI)
   */
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

  /*
   * call-seq: const_defined(scope, name, inherit) -> true or false
   *
   * Check if the constant +name+ is defined in scope +scope+.
   * TODO: respect +inherit+
   */
  const_defined: function(scope, name, inherit) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.const_find_scope(name);

    return (name in scope.constants);
  },

  /*
   * call-seq: const_get(scope, name, inherit) -> value
   *
   * Return the value of constant +name+ from scope +scope+.
   * If the constant is not found, +const_missing+ is invoked on the +scope+.
   * TODO: respect +inherit+
   */
  const_get: function(scope, name, inherit) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.const_find_scope(name);

    if(scope.constants[name] == undefined)
      return this.funcall(scope, 'const_missing', this.id2sym(name));

    return scope.constants[name];
  },

  /*
   * call-seq: const_set(scope, name, value) -> value
   *
   * Add a constant +name+ in scope +scope+ with the value +value+.
   * TODO: emit a warning if the constant is already defined
   */
  const_set: function(scope, name, value) {
    if(scope == this.builtin.Qnil) scope = this.c.Object;
    name = this.any2id(name);

    if(scope.constants[name] != undefined)
      this.warn("Constant " + this.id2text(strname) + " is already defined");

    scope.constants[name] = value;

    if(this.c && this.c.Kernel /* bind to a certain point in initialization */
              && this.obj_is_kind_of(value, this.c.Module)
              && scope.klass_name) {
      if(scope == this.c.Object) {
        value.klass_name = this.id2text(name);
      } else {
        value.klass_name = scope.klass_name + '::' + this.id2text(name);
      }
    }

    return value;
  },

  /* === CLASS VARIABLES === */

  /*
   * call-seq: cvar_find_scope(name) -> module instance
   *
   * Find a scope where class variable +name+ exists, starting from the
   * current context. The innermost scope (cref head) is returned if the
   * variable is not found.
   * TODO: check the search rules (comparing to MRI)
   */
  cvar_find_scope: function(name) {
    var cref = this.context.sf.cref;

    var klass = cref[0];
    while(klass) {
      if(name in klass.class_variables)
        return klass;
      klass = klass.superklass;
    }

    // Return the inner class, which is subject to definition of
    // unknown constants.
    return cref[0];
  },

  /*
   * call-seq: cvar_defined(scope, name) -> true or false
   *
   * Check existence of a class variable +name+ in scope +scope+.
   * Scope search is performed if +scope+ is Qnil.
   */
  cvar_defined: function(scope, name) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.cvar_find_scope(name);

    return (name in scope.class_variables);
  },

  /*
   * call-seq: cvar_get(scope, name) -> value
   *
   * Get a value of class variable +name+ in scope +scope+.
   * Scope search is performed if +scope+ is Qnil.
   * If such a variable does not exist, exception is raised.
   */
  cvar_get: function(scope, name) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.cvar_find_scope(name);

    if(!(name in scope.class_variables)) {
      this.raise2(this.e.NameError,
          [this.string_new("uninitialized class variable " +
          this.id2text(name) + ' in ' + this.class2name(scope)), this.id2sym(name)]);
    }

    return scope.class_variables[name];
  },

  /*
   * call-seq: cvar_set(scope, name, value) -> null
   *
   * Set a value of class variable +name+ in scope +scope+.
   * Value of existing variables is changed, retaining the scope of variable;
   * new variables are defined in innermost scope (current klass).
   */
  cvar_set: function(scope, name, value) {
    name = this.any2id(name);
    if(scope == this.builtin.Qnil)
      scope = this.cvar_find_scope(name);

    scope.class_variables[name] = value;

    return value;
  },

  /*
   * call-seq: cvar_remove(scope, name) -> value
   *
   * Remove a class variable +name+ from scope +scope+. Its value is returned.
   * Exception is raised if there is no such variable in the scope, or if
   * the variable exists in the scope, but is inherited from other one.
   */
  cvar_remove: function(scope, name) {
    name = this.any2id(name);
    var real_scope = this.cvar_find_scope(name);

    if(real_scope.class_variables[name] != undefined && real_scope != scope) {
      this.raise2(this.e.NameError,
          [this.string_new("cannot remove " + this.id2text(name) + ' for ' +
           this.class2name(scope)), this.id2sym(name)]);
    }

    if(scope.class_variables[name] == undefined) {
      this.raise2(this.e.NameError,
          [this.string_new("class variable " + this.id2text(name) +
           ' not defined for ' + this.class2name(scope)), this.id2sym(name)]);
    }

    var value = scope.class_variables[name];

    delete scope.class_variables[name];

    return value;
  },

  /* === CLASSES AND MODULES === */
  define_module: function(name) {
    return this.define_module_under(null, name);
  },

  define_module_under: function(under, name, self_klass) {
    var klass = {
      klass:             self_klass || this.internal_constants.Module,
      singleton_klass:   null,
      constants:         {},
      class_variables:   {},
      instance_methods:  {},
      ivs:               {},
    };

    if(under == null) {
      klass.klass_name = name;

      this.internal_constants[name] = klass;
      this.constants[this.any2id(name)] = klass;

      return klass;
    } else {
      return this.const_set(under, name, klass);
    }
  },

  define_class: function(name, superklass) {
    return this.define_class_under(null, name, superklass);
  },

  define_class_under: function(module, name, superklass) {
    var module = this.define_module_under(module, name, this.internal_constants.Class);
    module.superklass = superklass || this.internal_constants.Object;
    return module;
  },

  get_singleton: function(object) {
    if(object == this.builtin.Qtrue || object == this.builtin.Qfalse ||
       object == this.builtin.Qnil) {
      return object.klass;
    } else if(object.klass != null && (
              (object.klass == $c.Fixnum || object.klass == $c.Symbol))) {
      this.raise($e.TypeError, "cannot define singleton class for Fixnum or Symbol");
    }

    if(object.singleton_klass)
      return object.singleton_klass;

    var singleton = {
      klass_name:        '<eigenclass>',
      klass:             this.internal_constants.Class,
      superklass:        null,
      constants:         {},
      instance_methods:  {},
      ivs:               {},
      type:              'singleton',
      object:            object,
    };

    object.singleton_klass = singleton;

    return singleton;
  },

  module_include: function(target, module) {
    var klass = target;
    while(klass) {
      if(klass == module || klass.origin == module)
        return;

      klass = klass.superklass;
    }

    var proxy = {
      klass_name:       module.klass_name,
      klass:            module,
      constants:        module.constants,
      class_variables:  module.class_variables, /* Probably. */
      instance_methods: module.instance_methods,
      superklass:       target.superklass,
      type:             'module_proxy',
    };

    target.superklass = proxy;
  },

  visibility: function(klass, visibility) {
    var type;
    if(visibility == 'public') {
      type = null;
    } else if(visibility == 'private' || visibility == 'protected') {
      type = visibility;
    } else {
      throw new Error("Unknown visibility " + visibility);
    }

    if(arguments.length > 2) {
      for(var i = 2; i < arguments.length; i++) {
        var method = this.any2id(arguments[i]);
        //klass.instance_methods[method].visibility = type;
      }
    } else {
      klass.default_visibility = type;
    }
  },

  wrap_method: function(klass, name, want_args, method, native_info) {
    var wrapper;

    if(typeof method != 'function') {
      if(method.klass == this.c.InstructionSequence) {
        wrapper = method;
      } else {
        throw new Error("wrap_method: invalid object");
      }
    } else {
      if(want_args >= 0) {
        wrapper = function(self, args) {
          this.check_args(args, want_args);
          args.unshift(self);
          return method.apply(this, args);
        };
      } else if(want_args == -1) {
        wrapper = method;
      } else {
        throw new Error("wrap_method: unknown want_args type " + want_args);
      }

      if(!native_info)
        native_info = { file: '<unknown>', line: 0 };

      wrapper.info = {
        type: 'method',

        file: '<runtime:' + native_info.file + '>',
        path: '<runtime:' + native_info.file + '>',
        line: native_info.line,
        func: this.id2text(name),
      };
    }

    if(this.context && this.context.sf) {
      wrapper.context = {
        ddef: this.context.sf.ddef,
        cref: this.context.sf.cref,
      };
    } else {
      wrapper.context = {
        ddef: klass,
        cref: [klass],
      };
    }

    return wrapper;
  },

  define_method: function(klass, name, want_args, method, native_info) {
    name = this.any2id(name);

    klass.instance_methods[name] = this.wrap_method(klass, name, want_args, method, native_info);
  },

  define_singleton_method: function(klass, name, want_args, method, native_info) {
    name = this.any2id(name);

    var singleton = this.get_singleton(klass);
    singleton.instance_methods[name] = this.wrap_method(klass, name, want_args, method, native_info);
  },

  alias_method: function(klass, name, other_name) {
    name       = this.any2id(name);
    other_name = this.any2id(other_name);

    klass.instance_methods[name] = this.find_method(klass, other_name, false, true);
  },

  attr: function(type, klass, methods) {
    var ruby = this;
    if(typeof methods == 'string') {
      methods = [methods];
    }

    for(var i = 0; i < methods.length; i++) {
      var method = this.any2id(methods[i]), v = '@' + this.id2text(method);
      var ruby = this;
      (function(method, v) {
        if(type == 'reader' || type == 'accessor') {
          ruby.define_method(klass, method, 0, function(self) {
            var iv = self.ivs[v];
            return iv == null ? ruby.builtin.Qnil : iv;
          });
        }
        if(type == 'writer' || type == 'accessor') {
          ruby.define_method(klass, ruby.id2text(method) + '=', 1, function(self, value) {
            self.ivs[v] = value;
            return value;
          });
        }
      })(method, v);
    }
  },

  find_method: function(object, method, superobject, search_klass) {
    var func = null;

    if(object != null) {
      var klass;

      if(!search_klass && !superobject) {
        func = this.find_method(object.singleton_klass, method, false, true);

        if(func == null && object.klass == this.internal_constants.Class &&
                  object.type != 'singleton') {
          klass = object.superklass;

          while(func == null && klass != null) {
            func = this.find_method(klass.singleton_klass, method, false, true);

            klass = klass.superklass;
          }
        }
      }

      klass = search_klass ? object : (superobject ? superobject.superklass : object.klass);

      while(func == null && klass != null) {
        if(func == null && klass.instance_methods)
          func = klass.instance_methods[method];

        klass = klass.superklass;
      }
    }

    return func;
  },

  code_location: function() {
    var sf = this.context.sf, iseq = sf.iseq;

    if(iseq.info != null) {
      var line = iseq.info.line;
      if(sf.line != null)
        line = sf.line;

      return iseq.info.file + ":" + line;
    }

    return "<unknown>:0";
  },

  warn: function(message) {
    message = this.code_location() + ": warning: " + message;

    this.funcall(this.context.sf.self, 'puts',
            this.string_new(message));
  },

  obj_infect: function(object, source) {
    // implement tainting here
  },

  /*
   * call-seq: test(object) -> true or false
   *
   * Returns true if the object is logically true for Ruby (not nil or false).
   * Returns false otherwise.
   */
  test: function(object) {
    return !(object == this.builtin.Qnil || object == this.builtin.Qfalse);
  },

  /*
   * call-seq: respond_to(object, method) -> true or false
   *
   * Check if the +object+ responds to message +method+.
   */
  respond_to: function(object, method) {
    return this.find_method(object, this.any2id(method)) != null;
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

  /*
   * call-seq: check_type(arg, type) -> arg
   *
   * Check the type of argument +arg+. +type+ may be Class or array of Classes.
   * An exception is raised if the type is not matched.
   */
  check_type: function(arg, type) {
    if(type instanceof Array) {
      for(var i = 0; i < type.length; i++) {
        if(arg.klass == type[i])
          return arg;
      }

      this.raise(this.e.TypeError, "Type mismatch: " + this.obj_classname(arg) +
                                   " is not expected");
    } else {
      if(arg.klass != type)
        this.raise(this.e.TypeError, "wrong argument type " +
                   this.obj_classname(arg) + " (expected " +
                   this.class2name(type) + ")");

      return arg;
    }
  },

  check_convert_type: function(arg, type, converter) {
    if(arg.klass != type) {
      if(this.respond_to(arg, converter)) {
        return this.funcall(arg, converter);
      } else {
        this.raise(this.e.TypeError, "Cannot convert " +
              this.obj_classname(arg) + " into " + this.class2name(type));
      }
    } else {
      return arg;
    }
  },

  /*
   * call-seq: raise(template, message, backtrace=null, skip=null)
   *
   * If +template+ is a string, RuntimeError is raised with message +template+.
   * Otherwise, an exception is instantiated by calling method +exception+
   * on +template+, passing +message+ as an argument.
   * Backtrace is set to +backtrace+, and first +skip+ entries are removed
   * from it.
   */
  raise: function(template, message, backtrace, skip) {
    if(typeof message == 'string')
      message = this.string_new(message);

    if(template.klass == this.c.String) {
      var exception = this.funcall2(this.internal_constants.RuntimeError, 'new', [template]);
    } else {
      var args = (message != null) ? [message] : [];
      var exception = this.funcall2(template, 'exception', args);
    }

    if(!backtrace) {
      backtrace = [];

      var sf = this.context.sf;
      while(sf) {
        if(sf.iseq.info) { // YARV bytecode
          backtrace.push(this.string_new(sf.iseq.info.file + ':' +
                (sf.line || sf.iseq.info.line) + ': in `' +
                sf.iseq.info.func + '\''));
        } else {
          backtrace.push(this.string_new('unknown:0: in `<native:unknown>\''));
        }
        sf = sf.parent;
      }
    }

    if(skip) backtrace = backtrace.slice(skip);

    this.funcall(exception, 'set_backtrace', backtrace);

    throw { op: 'raise', object: exception };
  },

  /*
   * call-seq: raise2(klass, args, backtrace=null, skip=null)
   *
   * Raise an exception of class +class+, instantiating it with class method
   * +exception+ with arguments +args+ passed. Backtrace is set to +backtrace+,
   * and first +skip+ entries are removed from it.
   */
  raise2: function(klass, args, backtrace, skip) {
    var exception = this.funcall2(klass, 'exception', args);
    this.raise(exception, undefined, backtrace, skip);
  },

  /*
   * call-seq: raise3(exception)
   *
   * Re-throw an existing exception.
   */
  raise3: function(exception) {
    throw { op: 'raise', object: exception };
  },

  /*
   * call-seq: protect(code, rescue) -> value
   *
   * Execute a block +code+ in protected mode, catching Ruby exceptions.
   * +rescue+ is a closure which is called with one argument, the exception.
   * The value returned is either +code+ retrun value or +rescue+ return value.
   */
  protect: function(code, rescue) {
    try {
      return code.call(this);
    } catch(e) {
      if(e.op == 'raise') {
        return rescue.call(this, e.object);
      } else {
        throw e;
      }
    }
  },

  /*
   * call-seq: obj_classname(object) -> string
   *
   * Return a class name for the object +object+.
   */
  obj_classname: function(object) {
    return object.klass.klass_name;
  },

  /* call-seq: class2name(klass) -> string
   *
   * Return a name for class +klass+.
   */
  class2name: function(klass) {
    return klass.klass_name ? klass.klass_name : '<anonymous class>';
  },

  /*
   * call-seq: execute_class(cbase, name, superklass, is_class, iseq) -> value
   *
   * Execute +iseq+ in class context.
   *
   * If +name+ is not null, the code is executed in context of module +name+
   * from scope +cbase+. The module is created (if it does not exist).
   * If +is_class+ is true, the module created is a Class, otherwise it is a
   * Module. Its parent is +superklass+. It is assigned to constant +name+
   * upon creation.
   */
  execute_class: function(cbase, name, superklass, is_class, iseq) {
    if(name != null) {
      if(!this.obj_is_kind_of(cbase, this.c.Module))
        this.raise(this.e.TypeError, this.funcall(cbase, 'inspect').value +
                   " is not a class/module");

      if(!this.const_defined(cbase, name)) {
        if(superklass.type == 'singleton')
          this.raise(this.e.TypeError, "can't make subclass of singleton class");

        var klass = {
          klass:             is_class ? this.internal_constants.Class : this.internal_constants.Module,
          superklass:        superklass == this.builtin.Qnil ? this.internal_constants.Object : superklass,
          singleton_klass:   null,
          constants:         {},
          class_variables:   {},
          instance_methods:  {},
          ivs:               {},
        };
        this.const_set(cbase, name, klass);

        if(superklass != this.builtin.Qnil)
          this.funcall(superklass, 'inherited', klass);
      } else {
        var klass = this.const_get(cbase, name);

        if((is_class  && klass.klass == this.c.Module) ||
           (!is_class && klass.klass == this.c.Class))
          this.raise(this.e.TypeError, this.funcall(klass, 'inspect').value +
                     " is not a " + (is_class ? 'class' : 'module'));

        if(superklass != this.builtin.Qnil &&
           klass.superklass != superklass)
          this.raise(this.e.TypeError, "superklass mismatch for class " +
                     this.funcall(klass, 'inspect'));
      }
    } else { // singleton
      var klass = this.get_singleton(cbase);
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

  /*
   * call-seq: funcall(receiver, method, ...) -> value
   *
   * Call +method+ on +receiver+ with arguments from vararg list.
   */
  funcall: function(receiver, method) {
    var args_array = [];
    for(var i = 2; i < arguments.length; i++) {
      args_array.push(arguments[i]);
    }
    return this.funcall2(receiver, method, args_array);
  },

  /*
   * call-seq: funcall(receiver, method, args, block, vcall) -> value
   *
   * Call +method+ on +receiver+ with arguments +args+ and passing
   * block +block+. If +vcall+ is true, the +method+ may also be a local
   * variable, and, if method is missing, the error message will be
   * formatted accordingly.
   */
  funcall2: function(receiver, method, args, block, vcall) {
    if(receiver == null || method == null) {
      var c_receiver = this.context.sf.self;
    } else {
      var c_receiver = receiver;
    }

    if(method == null) { // super
      // magic belongs here

      // we can safely skip non-osf's, as they all belong to closures
      var sf = this.context.sf.osf;
      while(sf && sf.iseq.info.type != 'method') {
        if(sf == sf.osf) {
          sf = null;
          break;
        }
        sf = sf.osf;
      }

      if(!sf) {
        this.raise2(this.internal_constants.NoMethodError,
          [this.string_new("super called outside of method"),
           this.builtin.Qnil, args]);
      }

      var c_method = this.any2id(sf.iseq.info.func);
      var superobj = sf['super'] || c_receiver.klass;
    } else {
      var c_method = this.any2id(method);
      var superobj = null;
    }

    var func = this.find_method(c_receiver, c_method, superobj);

    if(func == undefined) {
      if(method) {
        if(!vcall) {
          this.context.last_call_type = 'method';
        } else {
          this.context.last_call_type = 'vcall';
        }

        args = [ this.id2sym(this.any2id(method)) ].concat(args);
      } else {
        this.context.last_call_type = 'super';
      }

      return this.funcall2(c_receiver, 'method_missing', args, block);
    }

    var sf_opts = {
      block: block,
      'super': superobj ? superobj.superklass : undefined,

      self: c_receiver,
      ddef: func.context.ddef,
      cref: func.context.cref,
    };

    return this.execute(sf_opts, func, args);
  },

  /*
   * call-seq: super1(...) -> value
   *
   * Call a superclass method. Arguments are interpreted as a vararg list.
   */
  super1: function() {
    return this.funcall2(null, null, arguments);
  },

  /*
   * call-seq: super2(args, block) -> value
   *
   * Call a superclass method. +block+ is optional.
   * Equivalent to Ruby `super *args, &block'.
   */
  super2: function(args, block) {
    return this.funcall2(null, null, args, block);
  },

  /*
   * call-seq: super3() -> value
   *
   * Call a superclass method with arguments from the current context.
   * Internal.
   */
  super3: function() {
    return this.funcall2(null, null, this.context.sf.args, this.context.sf.block);
  },

  /*
   * call-seq: block_given_p(sf=null) -> true or false
   *
   * Check existence of a block in current context or stack frame +sf+.
   */
  block_given_p: function(sf) {
    var sf = sf || this.context.sf, block;

    if(sf.outer) {
      block = sf.outer.osf.block;
    } else {
      block = sf.osf.block;
    }

    return !!block;
  },

  /*
   * call-seq: block_proc() -> Proc
   *
   * Convert a block in current context to a proc.
   */
  block_proc: function() {
    return this.proc_new();
  },

  /*
   * call-seq: block_lambda() -> Proc
   *
   * Convert a block in current context to a lambda.
   */
  block_lambda: function() {
    var proc = this.proc_new();

    proc.iseq.lambda = true;

    return proc;
  },

  /*
   * call-seq: lambda(closure, arg_count) -> block
   *
   * Convert a JavaScript closure to a block which may be passed to
   * funcall2(). +arg_count+ may be a positive number or -1; in latter case
   * count is not checked at all.
   */
  lambda: function(closure, arg_count) {
    var sf = this.context.sf;

    var iseq;
    if(arg_count >= 0) {
      iseq = function(self, args) {
        this.check_args(args, arg_count);
        args.unshift(self);
        return closure.apply(this, args);
      };
    } else if(arg_count == -1) {
      iseq = closure;
    } else {
      throw new Error("lambda with incorrect argument count");
    }

    iseq.context = {
      self: sf.self,
      ddef: sf.ddef,
      cref: sf.cref,
    };

    iseq.info = {
      args: {
        argc: arg_count,
      }
    };

    iseq.stack_frame = sf;
    iseq.lambda = true;

    return iseq;
  },

  /*
   * call-seq: yield1(...) -> value
   *
   * Yield to a block. Equivalent to Ruby `yield' with vararg list as
   * arguments.
   */
  yield1: function() {
    return this.yield2(arguments);
  },

  /*
   * call-seq: yield2(args) -> value
   *
   * Yield to a block. Equivalent to Ruby `yield *args'.
   */
  yield2: function(args) {
    var sf = this.context.sf, iseq;

    if(sf.outer) {
      iseq = sf.outer.osf.block;
    } else {
      iseq = sf.osf.block;
    }

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

  /*
   * call-seq: iter_break()
   *
   * Break a loop. Equivalent to Ruby `break'.
   */
  iter_break: function() {
    throw { op: 'break', object: Qnil };
  },

  /*
   * call-seq: obj_is_kind_of(object, class) -> true or false
   *
   * Checks if +class+ is +object+'s class or one of its ancestors.
   */
  obj_is_kind_of: function(object, c) {
    this.check_type(c, [$c.Class, $c.Module]);
    var klass = object.klass;

    do {
      if(klass == c || (klass.type == 'module_proxy' && klass.klass == c))
        return true;
    } while(klass = klass.superklass);

    return false;
  },

  /*
   * call-seq: get_local(sf, name, value) -> value or null
   *
   * Return a local variable +name+ from stack frame +sf+.
   */
  get_local: function(sf, name) {
    var names = sf.iseq.info.locals;

    for(var i = 0; i < names.length; i++) {
      if(names[i] == name)
        return sf.locals[i + 2]; // Why the +2? God knows. I don't.
    }

    return null;
  },

  /*
   * call-seq: set_local(sf, name, value) -> true or false
   *
   * Set a local variable +name+ in stack frame +sf+ to +value+.
   * true is returned when variable is found in +sf+, false otherwise.
   * No up-traversing is performed.
   */
  set_local: function(sf, name, value) {
    var names = sf.iseq.info.locals;

    for(var i = 0; i < names.length; i++) {
      if(names[i] == name) {
        sf.locals[i + 2] = value;

        return true;
      }
    }

    return false;
  },

  /*
   * call-seq: execute(options, iseq, args, exception=null) -> value
   *
   * Execute an instruction sequence +iseq+ with arguments +args+, within a
   * new stack frame in current context. +exception+ should be set to exception
   * object when executing rescue handler.
   *
   * +options+ is a hash which will be used to tweak stack frame.
   * The interesting options are:
   *  - self, ddef and cref: implicit contexts, see http://yugui.jp/articles/846
   *  - outer: a link to outer stack frame, which will be used to setup
   *    dynamic environment for closures. Should be null for functions.
   *  - block: a block passed to the code
   *  - super: a class which will be used for `super' calls.
   */
  execute: function(opts, iseq, args, exception) {
    var new_sf = {
      parent:  this.context.sf,

      stack:   [],
      sp:      0,
      locals:  [],
      dynamic: [],
      osf:     null,

      self: null,
      ddef: null,
      cref: null,

      iseq: iseq,
      line: null,
      args: args,
    };

    for(var key in opts) {
      new_sf[key] = opts[key];
    }

    var old_args = args;
    args = [];
    for(var i = 0; i < old_args.length; i++) {
      args.push(old_args[i]);
      if(args[i] == null || args[i].klass == undefined)
        throw new Error("argument " + i + " (" + args[i] + ") does not look like Ruby object");
    }

    if(typeof iseq == 'object') {
      if((iseq.lambda || iseq.info.type == 'method') &&
          args.length < iseq.info.args.argc) {
        throw "argument count mismatch: " + args.length + " < " + iseq.info.args.argc;
      }

      var argsinfo = iseq.info.args;
      var new_args = [];

      if(argsinfo.block > -1) {
        if(new_sf.block) {
          new_args[argsinfo.block] = { klass: this.c.Proc, iseq: new_sf.block };
        } else {
          new_args[argsinfo.block] = this.builtin.Qnil;
        }
      }

      for(var i = 0; i < argsinfo.argc; i++)
        new_args[i] = args[i];

      args = args.splice(argsinfo.argc);
      if(argsinfo.rest > -1) {
        new_args[argsinfo.rest] = args;
        args = [];
      }

      if(args.length > 0 && !(iseq.info.type == 'block' && !iseq.lambda))
        this.raise(this.e.ArgumentError, "wrong number of arguments " +
                   "(" + old_args.length + " for " + argsinfo.argc + ")");

      for(var i = 0; i < iseq.info.arg_size; i++) {
        new_sf.locals[iseq.info.local_size - i] =
            new_args[i] == null ? this.builtin.Qnil : new_args[i];
      }
    }

    new_sf.dynamic.push(new_sf);
    if(new_sf.outer) {
      var outer = new_sf.outer;
      while(outer != null) {
        new_sf.dynamic.push(outer);
        new_sf.osf = outer;
        outer = outer.outer;
      }
    } else {
      new_sf.osf = new_sf;
    }

    if(exception) {
      if(!this.set_local(new_sf, '#$!', exception)) {
        throw new Error("No #$! local in exception context");
      }
    }

    this.context.sf = new_sf;

    if(typeof iseq == 'object') {
      var chunk = 0, handler_chunk = null;
      while(chunk != null) {
        try {
          if(handler_chunk != null) {
            var handler = iseq[handler_chunk];
            handler.call(this);
            handler_chunk = null;
          } else {
            chunk = iseq[chunk].call(this);
          }
        } catch(e) {
          var type = null;
          if(e.hasOwnProperty('op')) {
            type = e.op;
          } else throw e; // dooooown to the basement

          var found = false;

          switch(type) {
            case 'return':
            if(iseq.lambda || iseq.info.type == 'method') {
              chunk = null;
              found = true;
              new_sf.sp = 0;
            } else {
              throw e;
            }
            break;

            case 'break':
            if(iseq.info.type == 'method') {
              chunk = null;
              found = true;
              new_sf.sp = 0;
            } else {
              throw e;
            }
            break;
          }

          var catches = iseq.info.catch_table;
          for(var i = 0; i < catches.length; i++) {
            if(catches[i].st <= chunk && catches[i].ed >= chunk) {
              if((catches[i].type == 'rescue' || catches[i].type == 'ensure') &&
                    type == 'raise') {
                if(handler_chunk == catches[i].handler ||
                    (catches[i].type == 'ensure' && catches[i].ed == chunk)) {
                  /* An exception arised in handler, and it is about to be
                     handled by the same one */
                  break;
                }

                handler_chunk = catches[i].handler;
                new_sf.stack[new_sf.sp++] = e.object;
              } else if(type == 'retry') {
                handler_chunk = null;
                new_sf.sp--;
              } else {
                continue;
              }

              chunk = catches[i].cont;

              found = true;
              break;
            }
          }

          if(!found) {
            this.context.sf = new_sf.parent;
            throw e;
          }
        }
      }

      if(new_sf.sp != 1) {
        throw new Error("Invalid stack frame at exit: sp (" + new_sf.sp + ") != 1");
      }

      var retval = new_sf.stack[0];
    } else {
      try {
        var retval = iseq.call(this, new_sf.self, args);

        if(retval == null || retval.klass == undefined)
          throw new Error("return value (" + retval + ") does not look like Ruby object");
      } catch(e) {
        var type = null;
        if(e.hasOwnProperty('op')) {
          type = e.op;
        } else throw e; // dooooown to the basement

        var found = false;

        switch(type) {
          case 'break':
          if(iseq.lambda)
            throw e;

          /* Fallthrough */
          case 'return':
          new_sf.sp = null;
          found = true;
          break;
        }

        if(!found) {
          this.context.sf = new_sf.parent;
          throw e;
        }

        retval = e.object;
      }
    }

    this.context.sf = new_sf.parent;

    return retval;
  },

  /*
   * call-seq: to_int(value) -> number
   *
   * Converts +value+ to Ruby Fixnum (and to JavaScript number).
   */
  to_int: function(value) {
    return this.check_convert_type(value, this.c.Fixnum, 'to_int');
  },

  /*
   * call-seq: to_str(value) -> number
   *
   * Converts +value+ to Ruby String (and to JavaScript string).
   */
  to_str: function(value) {
    return this.check_convert_type(value, this.c.String, 'to_str');
  },

  /*
   * call-seq: to_ary(value) -> number
   *
   * Converts +value+ to Ruby Array (and to JavaScript array).
   */
  to_ary: function(value) {
    return this.check_convert_type(value, this.c.Array, 'to_ary');
  },

  /*
   * call-seq: to_sym(value) -> number
   *
   * Converts +value+ to Ruby Symbol.
   */
  to_sym: function(value) {
    return this.check_convert_type(value, this.c.Symbol, 'to_sym');
  },

  /*
   * call-seq: to_float(value) -> number
   *
   * Converts +value+ to Ruby Float.
   */
  to_float: function(value) {
    return this.check_convert_type(value, this.c.Float, 'to_f');
  },

  /*
   * call-seq: to_block(value) -> InstructionSequence
   *
   * Converts +value+ to Ruby InstructionSequence.
   * +value+ may be Proc or Symbol.
   */
  to_block: function(value) {
    this.check_type(value, [$c.Proc, $c.Symbol]);

    if(value.klass == $c.Symbol) {
      var proc = function(self, x) {
        return this.funcall(x, value);
      };

      return this.lambda(proc, 1);
    } else {
      return value.iseq;
    }
  },

  /*
   * call-seq: create_ruby()
   *
   * Creates a Ruby interpreter context (i.e. thread, but your underlying
   * javascript engine probably will not support them).
   */
  create_ruby: function() {
    var ruby = {
      __proto__: this,
      context: {
        sf:        null,
      },
      toplevel: {
        klass:             this.internal_constants.Object,
        class_variables:   {},
        ivs:               {},
        toplevel:          true
      }
    };

    ruby.define_singleton_method(ruby.toplevel, 'to_s', 0, function(self) {
      return this.string_new("main");
    });

    return ruby;
  },
};

var $c = $.internal_constants, $e = $c;
