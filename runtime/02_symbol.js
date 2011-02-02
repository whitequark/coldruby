$.symbols = { last: -1 };

$.id2sym = function(id) {
  return {
    klass: $c.Symbol,
    value: id,
  };
};

$.text2sym = function(name) {
  for(var k in $.symbols) {
    if($.symbols[k] == name) {
      return $.id2sym(k);
    }
  }

  var symbol = this.id2sym($.symbols.last--);
  $.symbols[symbol.value] = name;

  return symbol;
};

$.id2text = function(id) {
  return this.symbols[id];
};

$.any2id = function(obj) {
  if(typeof obj == 'string' || typeof obj == 'number') {
    if(this.symbols[obj] == undefined) {
      return this.text2sym(obj).value;
    } else {
      return obj;
    }
  } else if(obj.klass == this.internal_constants.Symbol) {
    return obj.value;
  } else {
    throw "unknown object for any2id: " + obj;
  }
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
$.alias_method($c.Symbol, 'id2name', 'to_s');

$.define_method($c.Symbol, 'to_sym', 0, function(self) {
  return self;
});
$.alias_method($c.Symbol, 'intern', 'to_sym');

$.define_method($c.Symbol, 'to_proc', 0, function(self) {
  throw "not implemented";
});

$.define_singleton_method($c.Symbol, 'all_symbols', 0, function(self) {
  var keys = $.symbols.keys;
  var symbols = [];
  for(var i = 0; i < keys.length; i++) {
    symbols.push($.text2sym(keys[i]));
  }
  return symbols;
});

$.builtin.setup();