$.define_class('BasicObject', null);
$.define_class('Object', $c.BasicObject);
$.define_class('Module', $c.Object);
$.define_class('Class',  $c.Module);

$c.Object.constants = $.constants;

$c.BasicObject.klass = $c.Object.klass = $c.Module.klass = $c.Class.klass = $c.Class;

$c.Symbol.klass = $c.Class;
$c.Symbol.superklass = $c.Object;

$c.Kernel = $.define_module('Kernel');

$.module_include($c.Object, $c.Kernel);

$.define_method($c.Class, 'allocate', 0, function(self) {
  return {
    klass: self,
    ivs:   {},
  };
});

$.define_method($c.Class, 'new', -1, function(self, args) {
  var object = this.funcall(self, 'allocate');
  this.funcall2(object, 'initialize', args, this.context.sf.block);

  return object;
});

$.define_method($c.Class, 'superclass', 0, function(self) {
  return self.superklass == null ? Qnil : self.superklass;
});

$.define_method($c.BasicObject, 'equal?', 1, function(self, other) {
  return self == other ? Qtrue : Qfalse;
});
$.alias_method($c.BasicObject, '==', 'equal?');

$.define_method($c.BasicObject, '!=', 1, function(self, other) {
  return this.test(this.funcall(self, '==', other)) ? Qfalse : Qtrue;
});

$.define_method($c.BasicObject, '!', 0, function(self) {
  return this.test(self) ? Qfalse : Qtrue;
});

$.define_method($c.BasicObject, 'method_missing', -1, function(self, args) {
  if(args.length < 1)
    this.raise($e.ArgumentError, "no id given");

  var sym = args[0];
  var for_obj = " `" + this.id2text(sym.value) + "' for " +
        this.funcall(self, 'inspect').value + ':' + self.klass.klass_name;

  switch(this.context.last_call_type) {
    case 'method':
    this.raise2($e.NoMethodError,
        [ this.string_new("undefined method" + for_obj), sym, args], null, 1);
    break;

    case 'vcall':
    this.raise2($e.NameError,
        [ this.string_new("undefined local variable or method" + for_obj), sym], null, 1);
    break;

    case 'super':
    this.raise2($e.NoMethodError,
        [ this.string_new("super: no superclass method" + for_obj), sym, args], null, 1);
    break;

    default:
    this.raise($e.RuntimeError,
        [ this.string_new("method_missing: unknown call type " +
            this.context.last_call_type) ]);
  }
});
