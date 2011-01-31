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
    /* TODO */
  },

  invoke_method: function(receiver, method, args, ctx) {
    //this.ps(ctx);

    func = this.find_method(receiver, method);

    var retval;
    if(func != null) {
      retval = func.call(receiver, args, ctx);
    } else {
      throw "cannot find method " + method;
    }

    //this.ps(ctx);

    return retval;
  },

  create_context: function() {
    var ruby = this;

    var toplevel = {
      klass: this.constants.Object,
      methods: {
        inspect: function(args) {
          ruby.check_args(args, 0);
          return "main";
        }
      },
      ivs: {}
    };

    var context = {
      ruby: this,
      sf: {
        stack:  [],
        sp:     0,
        locals: [],
        self:   toplevel,
      },
      osf: null,
    };

    context.osf = context.sf;

    return context;
  },

  execute: function(ctx, chunks) {
    var chunk = 0;
    while(chunk != null) {
      chunk = chunks[chunk].call(ctx);
    }
  },

  ps: function(ctx) {
    print("> Stack Frame <");
    pp(ctx.sf)
  }
};

var $c = $.constants;