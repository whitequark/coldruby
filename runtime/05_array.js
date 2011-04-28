$.define_class('Array', $c.Object);
$.module_include($c.Array, $c.Enumerable);

$.define_singleton_method($c.Array, '[]', -1, function(self, args) {
  return args;
});

$.define_singleton_method($c.Array, 'try_convert', 1, function(self, other) {
  if(this.respond_to(other, 'to_ary')) {
    return this.funcall(other, 'to_ary');
  } else return Qnil;
});

$.define_method($c.Array, '+', 1, function(self, other) {
  other = this.to_ary(other);

  return self.concat(other);
});

$.define_method($c.Array, '*', 1, function(self, count) {
  count = this.to_int(count);

  var result = [];
  for(var i = 0; i < count; i++)
    result = result.concat(self);

  return result;
});

$.define_method($c.Array, '-', 1, function(self, other) {
  other = this.to_ary(other);

  var result = [];

  for(var i = 0; i < self.length; i++) {
    var insert = true;

    for(var j = 0; j < other.length; j++) {
      if(this.test(this.funcall(self[i], '==', other[j]))) {
        insert = false;
        break;
      }
    }

    if(insert)
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, '[]', 1, function(self, index) {
  index = this.to_int(index);

  return self[index] == null ? Qnil : self[index];
});

$.define_method($c.Array, '[]=', 2, function(self, index, value) {
  index = this.to_int(index);

  self[index] = value;

  return value;
});

$.define_method($c.Array, 'at', 1, function(self, index) {
  index = this.to_int(index);

  if(index >= self.length || index < -self.length)
    return Qnil;

  if(index < 0)
    index = self.length + index;

  return self[index];
});

$.define_method($c.Array, 'any?', 0, function(self) {
  return self.length > 0 ? Qtrue : Qfalse;
});

$.define_method($c.Array, 'clear', 0, function(self) {
  self.splice(0, self.length);

  return self;
});

$.define_method($c.Array, 'compact', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++) {
    if(self[i] != Qnil)
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'compact!', 0, function(self) {
  var retval = Qnil;

  for(var i = 0; i < self.length; i++) {
    if(self[i] == Qnil) {
      self.splice(i, 1);
      i--;

      retval = self;
    }
  }

  return retval;
});

$.define_method($c.Array, 'delete', 1, function(self, object) {
  var block, result = null;
  if(this.block_given_p())
    block = this.block_lambda();

  for(var i = 0; i < self.length; i++) {
    if(this.test(this.funcall(self[i], '==', object))) {
      result = object;
      self.splice(i, 1);
      i--;
    }
  }

  if(result) {
    return result;
  } else {
    return block ? this.funcall(block, 'call') : Qnil;
  }
});

$.define_method($c.Array, 'delete_at', 1, function(self, index) {
  index = this.to_int(index);

  if(index >= self.length) {
    return Qnil;
  } else {
    return self.splice(index, 1)[0];
  }
});

$.define_method($c.Array, 'delete_if', 0, function(self) {
  var block = this.block_lambda();

  for(var i = 0; i < self.length; i++) {
    if(this.test(this.funcall(block, 'call', self[i]))) {
      self.splice(i, 1);
      i--;
    }
  }

  return self;
});

$.define_method($c.Array, 'each', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    this.yield(self[i]);
  }
  return self;
});

$.define_method($c.Array, 'empty?', 0, function(self) {
  return self.length == 0 ? Qtrue : Qfalse;
});

$.define_method($c.Array, 'fetch', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var index = args[0], def = args[1], block;

  if(this.block_given_p() && def == null)
    block = this.block_lambda();

  if(index >= self.length || index < -self.length) {
    if(block == null && def == null) {
      this.raise(this.c.IndexError, "index " + index.toString() +
            " outside of array bounds: " + (-self.length).toString() +
            "..." + self.length.toString());
    } else if(def != null) {
      return def;
    } else {
      return this.funcall(block, 'call', index);
    }
  }

  if(index < 0)
    index = self.length + index;

  return self[index];
});

$.define_method($c.Array, 'find_index', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var object = args[0], block;

  if(object == null)
    block = this.block_lambda();

  for(var i = 0; i < self.length; i++) {
    if((object != null && this.test(this.funcall(self[i], '==', object)) ||
       (block != null && this.test(this.funcall(block, 'call', self[i])))))
      return i;
  }

  return Qnil;
});
$.alias_method($c.Array, 'index', 'find_index');

$.define_method($c.Array, 'insert', -1, function(self, args) {
  if(args.length < 1)
    this.raise($c.ArgumentError, "wrong number of arguments (at least 1)");

  var index = this.to_int(args[0]);

  for(var i = 1; i < args.length; i++)
    self.splice(index, 0, args[i]);

  return self;
});

$.define_method($c.Array, 'join', -1, function(self, args) {
  $.check_args(args, 0, 1);

  var separator = this.to_str(args[0] || this.gvar_get('$,'));

  var output = "";
  for(var i = 0; i < self.length; i++) {
    output += this.to_str(self[i]).value;
    if(i < self.length - 1)
      output += separator;
  }

  return this.string_new(output);
});

$.define_method($c.Array, 'length', 0, function(self) {
  return self.length;
});
$.alias_method($c.Array, 'size', 'length');

$.define_method($c.Array, 'map', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++)
    result.push(this.yield(self[i]));

  return result;
});

$.define_method($c.Array, 'map!', 0, function(self) {
  for(var i = 0; i < self.length; i++)
    self[i] = this.yield(self[i]);

  return self;
});

$.define_method($c.Array, 'pop', 0, function(self) {
  return self.pop();
});

$.define_method($c.Array, 'push', 1, function(self, obj) {
  self.push(obj);

  return self;
});
$.alias_method($c.Array, '<<', 'push');

$.define_method($c.Array, 'reject', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++) {
    if(!this.test(this.yield(self[i])))
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'reject!', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    if(this.test(this.yield(self[i]))) {
      self.splice(i, 1);
      i--;
    }
  }

  return self;
});

$.define_method($c.Array, 'replace', 1, function(self, array) {
  array = this.to_ary(array);

  self.splice(0, self.length);

  for(var i = 0; i < array.length; i++) {
    self.push(array[i]);
  }

  return self;
});

$.define_method($c.Array, 'reverse', 0, function(self) {
  var result = [];

  for(var i = self.length - 1; i >= 0; i--)
    result.push(self[i]);

  return result;
});

$.define_method($c.Array, 'reverse!', 0, function(self) {
  return this.funcall(self, 'replace', this.funcall(self, 'reverse'));
});

$.define_method($c.Array, 'reverse_each', 0, function(self) {
  for(var i = self.length - 1; i >= 0; i--)
    this.yield(self[i]);

  return self;
});

$.define_method($c.Array, 'rindex', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var object = args[0], block;

  if(object == null)
    block = this.block_lambda();

  for(var i = self.length - 1; i >= 0; i--) {
    if((object != null && this.test(this.funcall(self[i], '==', object)) ||
       (block != null && this.test(this.funcall(block, 'call', self[i])))))
      return i;
  }

  return Qnil;
});

$.define_method($c.Array, 'select', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++) {
    if(this.test(this.yield(self[i])))
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'select!', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    if(!this.test(this.yield(self[i]))) {
      self.splice(i, 1);
      i--;
    }
  }

  return self;
});

$.define_method($c.Array, 'shift', 0, function(self) {
  return self.shift();
});

$.define_method($c.Array, 'to_ary', 0, function(self) {
  return self;
});
$.alias_method($c.Array, 'to_a', 'to_ary');

$.define_method($c.Array, 'to_s', 0, function(self) {
  var desc = [];
  for(var i = 0; i < self.length; i++) {
    desc.push(this.funcall(self[i], 'inspect').value);
  }
  return this.string_new("[" + desc.join(', ') + "]");
});

$.define_method($c.Array, 'unshift', 1, function(self, obj) {
  self.unshift(obj);
  return self;
});

$.define_method($c.Array, 'uniq!', 0, function(self) {
  // TODO
  return self;
});

Array.prototype.klass = $c.Array;
