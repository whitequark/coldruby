var $ = {
  constants: {},
  globals: {},
  builtin: {
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

  any2id: function(obj) {
    if(typeof obj == 'string' || typeof obj == 'number') {
      if(this.symbols[obj] == undefined) {
        return this.builtin.get_symbol(obj).value;
      } else {
        return obj;
      }
    } else if(obj.klass == this.constants.Symbol) {
      return obj.value;
    } else {
      throw "unknown object for any2id: " + obj;
    }
  },

  sym2id: function(sym) {
    return sym.value;
  },

  id2sym: function(id) {
    return this.symbols[id];
  },

  const_defined: function(scope, name) {
    if(scope == this.builtin.Qnil) {
      scope = this;
    }
    return (name in scope.constants);
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

  define_bare_class: function(name, superklass) {
    var klass = {
      klass_name:        name,
      klass:             this.constants.Class,
      superklass:        superklass,
      instance_methods:  {},
      singleton_methods: {},
      ivs:               {},
    };
    this.constants[name] = klass;
    return klass;
  },

  define_class: function(name, superklass) {
    var klass = this.define_bare_class(name, superklass);
    klass.singleton_methods[this.any2id('allocate')] = this.builtin['allocate'];
    klass.singleton_methods[this.any2id('new')]      = this.builtin['new'];
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
        if(method.klass == this.constants.Symbol) {
          method = this.id2sym(method.value);
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
        if(klass.instance_methods != null) {
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

  check_convert_type: function(arg, type, converter, ctx) {
    if(arg.klass != type) {
      return $.invoke_method(arg, converter, [], ctx);
    } else {
      return arg;
    }
  },

  execute_class: function(ctx, cbase, name, superklass, is_class, iseq) {
    if(!this.const_defined(cbase, name)) {
      var klass = {
        klass_name:        name,
        klass:             is_class ? this.constants.Class : this.constants.Module,
        superklass:        superklass == this.builtin.Qnil ? this.constants.Object : superklass,
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

    var sf_opts = {
      self: klass,
      ddef: klass,
      cref: ctx.sf.cref,
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
      throw "cannot find method " + this.id2sym(method);
    } else {
      return $.execute(ctx, sf_opts, func, args);
    }
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

    if(typeof iseq == 'object') {
      var method = iseq.info.func;
    } else {
      var method = '!native';
    }
//    this.ps(ctx, new_sf.self.klass.klass_name + '#' + method + ' in ' + new_sf.self);

    if(typeof iseq == 'object') {
      if(iseq.info.arg_size != args.length) {
        throw "argument count mismatch: " + args.length + " != " + iseq.info.arg_size;
      }

      for(var i = 0; i < iseq.info.arg_size; i++) {
        new_sf.locals[2 + i] = args[iseq.info.arg_size - i - 1];
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
      sf:   null,
      osf:  null,
    };
  },

  ps: function(ctx, where) {
    print("> Stack Frame ("+where+") <");
    pp(ctx.sf)
  }
};

var $c = $.constants;