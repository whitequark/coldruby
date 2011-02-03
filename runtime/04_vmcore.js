$.builtin.vmcore = {
  singleton_methods: {},
  klass: {
    klass_name: 'core'
  }
};

$.define_singleton_method($.builtin.vmcore,
    'core#define_method', 3, function(self, klass, meth, iseq) {
  meth = this.check_convert_type(meth, $c.Symbol, 'to_sym');
  iseq = this.check_type(iseq, $c.InstructionSequence);

  if(!klass.toplevel) {
    this.check_type(klass, [$c.Class, $c.Module]);
    $.define_method(klass, meth.value, 0, iseq);
  } else {
    $.define_method($c.Object, meth.value, 0, iseq);
  }

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#define_singleton_method', 3, function(self, obj, meth, iseq) {
  meth = this.check_convert_type(meth, $c.Symbol);
  iseq = this.check_type(iseq, $c.InstructionSequence);

  $.define_singleton_method(obj, meth.value, 0, iseq);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_method_alias', 3, function(self, klass, meth, other) {
  klass = this.check_type(klass, [$c.Class, $c.Module]);
  meth  = this.check_convert_type(meth,  $c.Symbol, 'to_sym');
  other = this.check_convert_type(other, $c.Symbol, 'to_sym');

  $.alias_method(klass, meth.value, other.value);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_variable_alias', 2, function(self, variable, other) {
  variable = this.check_convert_type(variable, $c.Symbol, 'to_sym');
  other    = this.check_convert_type(other,    $c.Symbol, 'to_sym');

  $.gvar_alias(variable.value, other.value);

  return Qnil;
});
