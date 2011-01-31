$.define_class('Symbol', $c.Object);
$.define_method($c.Symbol, '==', function(args) {
  $.check_args(args, 1);
  
  return args[0].klass == $c.Symbol && this.value == args[0].value;
});

$.define_method($c.Symbol, 'inspect', function(args) {
  $.check_args(args, 0);
  
  return ":" + $.symbols[this.value];
});

$.define_method($c.Symbol, 'to_s', function(args) {
  $.check_args(args, 0);
  
  return $.symbols[this.value];
});
$.alias_method($c.Symbol, 'id2name', 'to_s', true);

$.define_method($c.Symbol, 'to_sym', function(args) {
  $.check_args(args, 0);

  return this;
});
$.alias_method($c.Symbol, 'intern', 'to_sym', true);

$.define_method($c.Symbol, 'to_proc', function(args) {
  $.check_args(args, 0);

  throw "not implemented";
});

$.define_singleton_method($c.Symbol, 'all_symbols', function(args) {
  $.check_args(args, 0);

  var keys = $.symbols.keys;
  var symbols = [];
  for(var i = 0; i < symbols.length; i++) {
    symbols.push($.builtin.get_symbol(keys[i]));
  }
  return symbols;
});

$.symbols = {};
$.builtin.get_symbol = function(id) {
  return {
    klass: $c.Symbol,
    value: id,
  };
};