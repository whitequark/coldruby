var $ = {
  constants: {},
  globals: {},
  builtin: {},

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

  define_method: function(klass, name, method) {
    klass.instance_methods[name] = method;
    return method;
  },

  define_singleton_method: function(klass, name, method) {
    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = method;
    return method;
  },

  alias_method: function(klass, name, other_name, fast) {
    var ruby = this;
    if(fast) { // For builtins only
      klass.instance_methods[name] = klass.instance_methods[other_name];
    } else {
      klass.instance_methods[name] = function(args, ctx) {
        return ruby.find_method(this, other_name).call(this, args, ctx);
      };
    }
  },

  alias_singleton_method: function(klass, name, other_name) {
    if(klass.singleton_methods == undefined)
      klass.singleton_methods = {};
    klass.singleton_methods[name] = klass.singleton_methods[other_name];
  },

  find_method: function(object, method) {
    var func = null;

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
  },

  invoke_method: function(receiver, method, args, ctx) {
    this.ps(ctx, 'enter');

    func = this.find_method(receiver, method);

    var retval;
    if(func == undefined) {
      throw "cannot find method " + method;
    } else if(typeof func == 'function') {
      retval = func.call(receiver, args, ctx);
    } else if(func.klass == $c.ISeq) {
      retval = $.execute(ctx, ctx.sf.self, ctx.sf.cbase, func);
    } else {
      throw "trying to execute something weird " + func;
    }

    this.ps(ctx, 'exit');

    return retval;
  },

  execute: function(ctx, self, cbase, iseq) {
    var my_sf = {
      stack:  [],
      sp:     0,
      locals: [],
      self:   self,
      cbase:  cbase,
      parent: ctx.sf,
    };

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
    return {
      klass: this.constants.Object,
      methods: {
        inspect: function(args) {
          ruby.check_args(args, 0);
          return "main";
        }
      },
      ivs: {},
      toplevel: true
    };
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