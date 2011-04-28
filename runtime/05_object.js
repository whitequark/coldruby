$.define_method($c.Object, 'initialize', 0, function(self) {
});

$.define_method($c.Object, 'method_missing', -1, function(self, args) {
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

$.define_method($c.Kernel, 'nil?', 0, function(self) {
  return Qfalse;
});

$.alias_method($c.Kernel, 'eql?', 'equal?');

$.define_method($c.Kernel, '=~', 1, function(self, other) {
  return Qnil;
});

$.define_method($c.Kernel, '!~', 1, function(self, other) {
  return $.test(this.funcall(self, '=~', other)) ? Qfalse : Qtrue;
});

$c.Kernel.instance_methods[$.any2id('===')] =
          $c.BasicObject.instance_methods[$.any2id('==')];

$.define_method($c.Kernel, 'class', 0, function(self) {
  return self.klass;
});

// This complete method is an example of how _not_ to do
// hash-functions, but it's the best I can think of now.
$.define_method($c.Kernel, 'hash', 0, function(self) {
  return self.toString();
});

$.define_method($c.Kernel, 'to_s', 0, function(self) {
  return this.string_new("#<" + self.klass.klass_name + ">");
});

$.define_method($c.Kernel, 'inspect', 0, function(self) {
  return this.funcall(self, 'to_s');
});
