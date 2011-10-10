$.define_class('Hash', $c.Object, true);

$.hash_new = function(elements) {
  if(elements.length % 2 != 0) {
    this.raise(this.e.ArgumentError, "odd number of arguments for Hash");
  }

  var hash = {
    klass:    $c.Hash,
    keys:     {},
    values:   {},
    ivs:      {
      '@default': Qnil,
    },
  }
  for(var i = 0; i < elements.length; i += 2) {
    var key = elements[i], value = elements[i+1];

    var key_hash = this.funcall(key, 'hash');
    hash.keys[key_hash]   = key;
    hash.values[key_hash] = value;
  }
  return hash;
}

$.define_singleton_method($c.Hash, '[]', -1, function(self, args) {
  return this.hash_new(args);
});

$.define_singleton_method($c.Hash, 'new', -1, function(self, args) {
  this.check_args(args, 0, 1);

  var hash = this.hash_new([]);
  if(this.block_given_p()) {
    hash.ivs['@default_proc'] = this.block_proc();
  }

  return hash;
});

$.define_method($c.Hash, '[]', 1, function(self, key) {
  var hash = this.funcall(key, 'hash');

  var value = self.values[hash];
  if(value) {
    return value;
  } else if(self.ivs['@default_proc'] != undefined) {
    return this.funcall(self.ivs['@default_proc'], 'call', self, key);
  }

  return self.ivs['@default'];
});

$.define_method($c.Hash, '[]=', 2, function(self, key, value) {
  var hash = this.funcall(key, 'hash');

  self.keys[hash] = key;
  self.values[hash] = value;

  return value;
});
$.alias_method($c.Hash, 'store', '[]=');

$.define_method($c.Hash, 'each', 0, function(self) {
  for(var hash in self.keys)
    this.yield1(self.keys[hash], self.values[hash]);

  return self;
});
$.alias_method($c.Hash, 'each_pair', 'each');

$.define_method($c.Hash, 'each_key', 0, function(self) {
  for(var hash in self.keys)
    this.yield1(self.keys[hash]);

  return self;
});

$.define_method($c.Hash, 'each_value', 0, function(self) {
  for(var hash in self.keys)
    this.yield1(self.keys[hash]);

  return self;
});

$.define_method($c.Hash, 'empty?', 0, function(self) {
  for(var hash in self.keys)
    return Qfalse;

  return Qtrue;
});

$.define_method($c.Hash, 'length', 0, function(self) {
  var count = 0;
  for(var hash in self.keys)
    count += 1;

  return count;
});
$.alias_method($c.Hash, 'size', 'length');

$.define_method($c.Hash, 'has_key?', 1, function(self, key) {
  var hash = this.funcall(key, 'hash');

  return (hash in self.keys) ? Qtrue : Qfalse;
});
$.alias_method($c.Hash, 'include?', 'has_key?');
$.alias_method($c.Hash, 'member?',  'has_key?');
$.alias_method($c.Hash, 'key?',     'has_key?');

$.define_method($c.Hash, 'keys', 0, function(self) {
  var keys = [];
  for(var hash in self.keys)
    keys.push(self.keys[hash]);

  return keys;
});

$.define_method($c.Hash, 'has_value?', 0, function(self, value) {
  for(var hash in self.values) {
    if($.test(this.funcall(self.values[hash], '==', [value])))
      return Qtrue;
  }

  return Qfalse;
});
$.alias_method($c.Hash, 'value?', 'has_value?');

$.define_method($c.Hash, 'values', 0, function(self) {
  var values = [];
  for(var hash in self.values)
    values.push(self.values[hash]);

  return values;
});

$.define_method($c.Hash, 'values_at', -1, function(self, keys) {
  var values = [];

  for(var i = 0; i < keys.length; i++)
    values.push(self.values[this.funcall(keys[i], 'hash')] || Qnil);

  return values;
});

$.define_method($c.Hash, 'delete', 1, function(self, key) {
  var hash = this.funcall(key, 'hash');

  var key = self.keys[hash], value = self.values[hash];

  delete self.keys[hash];
  delete self.values[hash];

  if(value == undefined) {
    if(this.block_given_p()) {
      return this.yield1(key);
    } else {
      return self.iv['@default'];
    }
  } else {
    return value;
  }
});

$.define_method($c.Hash, 'delete_if', 0, function(self) {
  for(var hash in self.keys) {
    if($.test(this.yield1(self.keys[key]))) {
      delete self.keys[key];
      delete self.values[key];
    }
  }

  return self;
});

$.define_method($c.Hash, 'clear', 0, function(self) {
  self.keys   = {};
  self.values = {};
  return self;
});

$.attr('accessor', $c.Hash, 'default');
$.attr('accessor', $c.Hash, 'default_proc');

$.define_method($c.Hash, 'inspect', 0, function(self) {
  var desc = '';
  for(var hash in self.keys) {
    if(desc != '') {
      desc += ', ';
    }
    desc += this.funcall(self.keys[hash], 'inspect').value;
    desc += '=>';
    desc += this.funcall(self.values[hash], 'inspect').value;
  }

  return this.string_new('{' + desc + '}');
});
