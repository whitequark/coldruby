$.builtin.vmcore = {
  singleton_methods: {},
  klass: {
    klass_name: 'core'
  }
};

$.define_singleton_method($.builtin.vmcore,
    'core#define_method', 3, function(self, klass, meth, iseq) {
  meth = $.check_convert_type(meth, $c.Symbol, 'to_sym');
  iseq = $.check_type(iseq, $c.InstructionSequence);

  if(!klass.toplevel) {
    $.check_type(klass, $c.Class);
    $.define_method(klass, meth.value, 0, iseq);
  } else {
    $.define_method($c.Object, meth.value, 0, iseq);
  }

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#define_singleton_method', 3, function(self, obj, meth, iseq) {
  meth = $.check_convert_type(meth, $c.Symbol);
  iseq = $.check_type(iseq, $c.InstructionSequence);

  $.define_singleton_method(obj, meth.value, 0, iseq);

  return Qnil;
});

$.define_singleton_method($.builtin.vmcore,
    'core#set_method_alias', 3, function(self, klass, meth, other) {
  klass = $.check_type(klass, $c.Class);
  meth  = $.check_convert_type(meth,  $c.Symbol, 'to_sym');
  other = $.check_convert_type(other, $c.Symbol, 'to_sym');

  $.alias_method(klass, meth.value, other.value);
});
