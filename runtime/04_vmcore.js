$.builtin.vmcore = {
  klass: {
    klass_name: 'core'
  }
};

$.define_singleton_method($.builtin.vmcore,
    'core#define_method', 3, function(self, klass, meth, iseq) {
  meth = this.to_sym(meth);
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
  meth = this.to_sym(meth);
  iseq = this.check_type(iseq, $c.InstructionSequence);

  $.define_singleton_method(obj, meth.value, 0, iseq);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_method_alias', 3, function(self, klass, meth, other) {
  klass = this.check_type(klass, [$c.Class, $c.Module]);
  meth  = this.to_sym(meth);
  other = this.to_sym(other);

  $.alias_method(klass, meth.value, other.value);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_variable_alias', 2, function(self, variable, other) {
  variable = this.to_sym(variable);
  other    = this.to_sym(other);

  $.gvar_alias(variable.value, other.value);

  return Qnil;
});
