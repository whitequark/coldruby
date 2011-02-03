$.builtin.vmcore = {
  singleton_methods: {},
  klass: {
    klass_name: 'core'
  }
};

$.define_singleton_method($.builtin.vmcore,
    'core#define_method', 3, function(self, klass, meth, iseq) {
  meth = $.check_convert_type(this, meth, $c.Symbol, 'to_sym');
  iseq = $.check_type(this, iseq, $c.InstructionSequence);

  if(!klass.toplevel) {
    $.check_type(this, klass, [$c.Class, $c.Module]);
    $.define_method(klass, meth.value, 0, iseq);
  } else {
    $.define_method($c.Object, meth.value, 0, iseq);
  }

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#define_singleton_method', 3, function(self, obj, meth, iseq) {
  meth = $.check_convert_type(this, meth, $c.Symbol);
  iseq = $.check_type(this, iseq, $c.InstructionSequence);

  $.define_singleton_method(obj, meth.value, 0, iseq);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_method_alias', 3, function(self, klass, meth, other) {
  klass = $.check_type(this, klass, [$c.Class, $c.Module]);
  meth  = $.check_convert_type(this, meth,  $c.Symbol, 'to_sym');
  other = $.check_convert_type(this, other, $c.Symbol, 'to_sym');

  $.alias_method(klass, meth.value, other.value);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_variable_alias', 2, function(self, variable, other) {
  variable = $.check_convert_type(this, variable, $c.Symbol, 'to_sym');
  other    = $.check_convert_type(this, other,    $c.Symbol, 'to_sym');

  $.gvar_alias(variable.value, other.value);

  return Qnil;
});
