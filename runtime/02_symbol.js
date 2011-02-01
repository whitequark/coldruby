$.symbols = { last: -1 };
$.builtin.make_symbol = function(id) {
  return {
    klass: $c.Symbol,
    value: id,
  };
};
$.builtin.get_symbol = function(name) {
  for(var k in $.symbols) {
    if($.symbols[k] == name) {
      return $.builtin.make_symbol(k);
    }
  }

  var symbol = $.builtin.make_symbol($.symbols.last--);
  $.symbols[symbol.value] = name;

  return symbol;
};

$.define_class('Symbol', null); // will be set up later

$.define_method($c.Symbol, '==', 1, function(self, other) {
  return (other.klass == $c.Symbol && this.value == other.value) ? Qtrue : Qfalse;
});

$.define_method($c.Symbol, 'inspect', 0, function(self) {
  return ":" + $.symbols[self.value];
});

$.define_method($c.Symbol, 'to_s', 0, function(self) {
  return $.symbols[self.value];
});
$.alias_method($c.Symbol, 'id2name', 'to_s', true);

$.define_method($c.Symbol, 'to_sym', 0, function(self) {
  return self;
});
$.alias_method($c.Symbol, 'intern', 'to_sym', true);

$.define_method($c.Symbol, 'to_proc', 0, function(self) {
  throw "not implemented";
});

$.define_singleton_method($c.Symbol, 'all_symbols', 0, function(self) {
  var keys = $.symbols.keys;
  var symbols = [];
  for(var i = 0; i < keys.length; i++) {
    symbols.push($.builtin.fetch_symbol(keys[i]));
  }
  return symbols;
});
