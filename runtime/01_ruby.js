var $ = {
  constants: {},
  globals: {},
  builtin: {},

  sym2id: function(name) {
    if(this.symbols[name] == undefined) {
      return this.builtin.get_symbol(name).value;
    } else {
      return name;
    }
  },

  id2sym: function(id) {
    return this.symbols[id];
  },

  const_get: function(scope, name) {
    if(scope == this.builtin.Qnil) {
      scope = this;
    }
    if(scope.constants[name] == undefined) {
      throw "constant " + name + " is undefined";
    }

    return scope.constants[name];
  },

  const_set: function(scope, name, value) {
    if(scope == this.builtin.Qnil) {
      scope = this;
    }
    if(scope.constants[name] != undefined) {
      throw "constant " + name + " is already defined";
    }

    scope.constants[name] = value;

    return value;
  },

  define_class: function(name, superklass) {
    var klass = {
      klass_name:       name,
      klass:            this.constants.Class,
      superklass:       superklass,
      instance_methods: {},
      ivs:              {},
    };
    this.constants[name] = klass;
    return klass;
  },

  define_builtin_class: function(name) {
    var klass = this.define_class(name, this.constants.Object);
    klass.builtin = true; // Forbid #allocate and #new
    return klass;
  },

  wrap_method: function(want_args, method) {
    var ruby = this, wrapper;

    if(method.klass == this.constants.InstructionSequence) {
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
    if(typeof name == 'string') name = $.sym2id(name);

    klass.instance_methods[name] = this.wrap_method(want_args, method);
    return Qnil;
  },

  define_singleton_method: function(klass, name, want_args, method) {
    if(typeof name == 'string') name = $.sym2id(name);

    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = this.wrap_method(want_args, method);
    return Qnil;
  },

  alias_method: function(klass, name, other_name, fast) {
    var ruby = this;
    if(typeof name       == 'string') name       = $.sym2id(name);
    if(typeof other_name == 'string') other_name = $.sym2id(other_name);

    if(fast) { // For builtins only
      klass.instance_methods[name] = klass.instance_methods[other_name];
    } else {
      klass.instance_methods[name] = function(self, args) {
        return ruby.find_method(self, other_name).call(this, self, args);
      };
    }
  },

  alias_singleton_method: function(klass, name, other_name) {
    if(typeof name       == 'string') name       = $.sym2id(name);
    if(typeof other_name == 'string') other_name = $.sym2id(other_name);

    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = klass.singleton_methods[other_name];
  },

  find_method: function(object, method) {
    var func = null;

    if(typeof method == 'string') method = this.sym2id(method);

    if(object != null) {
      // Search singleton methods, and then class hierarchy
      if(object.singleton_methods != null) {
        func = object.singleton_methods[method];
      }

      var klass = object.klass;
      while(func == null && klass != null) {
        if(klass.instance_methods != null) {
          func = klass.instance_methods[method];
        }

        klass = klass.superklass;
      }
    }

    return func;
  },

  test: function(object) {
    return !(object == this.builtin.nil || object == this.builtin.Qfalse);
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
    if(arg.klass != type) {
      throw "type mismatch: " + arg.klass.klass_name + " != " + type.klass_name;
    }
    return arg;
  },

  check_convert_type: function(arg, type, converter, ctx) {
    if(arg.klass != type) {
      return $.invoke_method(arg, converter, [], ctx);
    } else {
      return arg;
    }
  },

  invoke_method: function(ctx, receiver, method, args) {
    func = this.find_method(receiver, method);

    var retval;
    if(func == undefined) {
      throw "cannot find method " + this.id2sym(method);
    } else if(typeof func == 'function') {
      retval = func.call(ctx, receiver, args);
    } else if(func.klass == $c.InstructionSequence) {
      retval = $.execute(ctx, ctx.sf.self, ctx.sf.cbase, func, args);
    } else {
      throw "trying to execute something weird " + func;
    }

    return retval;
  },

  execute: function(ctx, self, cbase, iseq, args) {
    var my_sf = {
      stack:  [],
      sp:     0,
      locals: [],
      self:   self,
      cbase:  cbase,
      parent: ctx.sf,
    };

    if(iseq.info.arg_size != args.length) {
      throw "argument count mismatch: " + args.length + " != " + iseq.info.arg_size;
    }

    for(var i = 0; i < iseq.info.arg_size; i++) {
      my_sf.locals[2 + i] = args[iseq.info.arg_size - i - 1];
    }

    ctx.sf  = my_sf;
    ctx.osf = my_sf;

    var chunk = 0;
    while(chunk != null) {
      chunk = iseq[chunk].call(ctx);
    }

    ctx.sf  = my_sf.parent;
    ctx.osf = ctx.sf;

    if(my_sf.sp == 0) {
      return Qnil;
    } else if(my_sf.sp == 1) {
      return my_sf.stack[0];
    } else {
      return my_sf.stack.slice(0, my_sf.sp);
    }
  },

  create_toplevel: function() {
    var toplevel = {
      klass: this.constants.Object,
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
      sf: null,
      osf: null,
    };
  },

  ps: function(ctx, where) {
    print("> Stack Frame ("+where+") <");
    pp(ctx.sf)
  }
};

var $c = $.constants;