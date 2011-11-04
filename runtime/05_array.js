$.define_class('Array', $c.Object);
$.module_include($c.Array, $c.Enumerable);

$.define_method($c.Kernel, 'Array', 1, function(self, object) {
  if(object instanceof Array) {
    return object;
  } else {
    return [object];
  }
});

$.define_singleton_method($c.Array, 'new', -1, function(self, args) {
  this.check_args(args, 0, 2);

  var array = [];
  if(args[0] != null && this.respond_to(args[0], 'to_ary')) {
    /* A copy of an array */
    array = this.to_ary(args[0]).slice();
  } else {
    var size = this.to_int(args[0] || 0), obj = args[1] || Qnil;

    if(this.block_given_p()) {
      for(var i = 0; i < size; i++)
        array.push(this.yield1(i));
    } else {
      for(var i = 0; i < size; i++)
        array.push(obj);
    }
  }

  return array;
});

$.define_singleton_method($c.Array, '[]', -1, function(self, args) {
  return args;
});

$.define_singleton_method($c.Array, 'try_convert', 1, function(self, other) {
  if(this.respond_to(other, 'to_ary')) {
    return this.funcall(other, 'to_ary');
  } else return Qnil;
});

$.define_method($c.Array, '&', 1, function(self, other) {
  var result = [];

  for(var i = 0; i < self.length; i++) {
    var go = false;

    for(var j = 0; j < other.length; j++) {
      if(this.test(this.funcall(self[i], '==', other[j]))) {
        go = true;
        break;
      }
    }

    if(!go) continue;

    result.push(self[i]);
  }

  return this.funcall(result, 'uniq');
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

$.define_method($c.Array, '<=>', 1, function(self, other) {
  var len = self.length < other.length ? self.length : other.length;

  for(var i = 0; i < len; i++) {
    var res = this.funcall(self[i], '<=>', other[i]);
    if(res != 0) return res;
  }

  return this.funcall(self.length, '<=>', other.length);
});

$.define_method($c.Array, '==', 1, function(self, other) {
  if(other == self)
    return Qtrue;

  if(other.length != self.length)
    return Qfalse;

  for(var i = 0; i < self.length; i++) {
    if(!this.test(this.funcall(self[i], '==', other[i])))
      return Qfalse;
  }

  return Qtrue;
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

$.define_method($c.Array, 'concat', 1, function(self, other) {
  return this.funcall(self, 'replace', self.concat(other));
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

$.define_method($c.Array, 'cycle', 1, function(self, n) {
  n = n || Qnil;
  if(n != Qnil)
    n = this.to_int(n);

  while(n == Qnil || n > 0) {
    for(var i = 0; i < self.length; i++)
      this.yield1(self[i]);

    if(typeof n == "number")
      n--;
  }

  return Qnil;
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

$.define_method($c.Array, 'drop', 1, function(self, n) {
  n = this.to_int(n);
  if(n < 0) n = 0;

  return self.slice(n);
});

$.define_method($c.Array, 'drop_while', 0, function(self) {
  var result = [], drop = true;

  for(var i = 0; i < self.length; i++) {
    if(drop && !this.test(this.yield1(self[i]))) {
      drop = false;
    }
    if(!drop)
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'each', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    this.yield1(self[i]);
  }

  return self;
});

$.define_method($c.Array, 'each_index', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    this.yield1(i);
  }

  return self;
});

$.define_method($c.Array, 'empty?', 0, function(self) {
  return self.length == 0 ? Qtrue : Qfalse;
});

$.define_method($c.Array, 'eql?', 1, function(self, other) {
  if(other == self)
    return Qtrue;

  if(other.length != self.length)
    return Qfalse;

  for(var i = 0; i < self.length; i++) {
    if(self[i] != other[i])
      return Qfalse;
  }

  return Qtrue;
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

$.define_method($c.Array, 'first', -1, function(self, args) {
  this.check_args(args, 0, 1);

  if(args[0] == null) {
    return self[0];
  } else {
    var n = this.to_int(args[0]);
    if(n < 0)
      n = 0;

    return self.slice(0, n);
  }
});

$.define_method($c.Array, 'include?', 1, function(self, object) {
  for(var i = 0; i < self.length; i++) {
    if(this.test(this.funcall(self[i], '==', object)))
      return Qtrue;
  }

  return Qfalse;
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

$.define_method($c.Array, 'flatten', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var level = args[0];

  if(level != null && level <= 0)
    return self;

  var result = [];

  for(var i = 0; i < self.length; i++) {
    if(self[i].klass == $c.Array) {
      var arr = this.funcall(self[i], 'flatten', level != null ? level - 1 : null);
      for(var j = 0; j < arr.length; j++)
        result.push(arr[j]);
    } else {
      result.push(self[i]);
    }
  }

  return result;
});

$.define_method($c.Array, 'flatten!', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var level = args[0];

  if(level != null && level <= 0)
    return Qnil;

  var result = [], changed = false;

  for(var i = 0; i < self.length; i++) {
    if(self[i].klass == $c.Array) {
      var arr = this.funcall(self[i], 'flatten', level != null ? level - 1 : null);
      for(var j = 0; j < arr.length; j++)
        result.push(arr[j]);
      changed = true;
    } else {
      result.push(self[i]);
    }
  }

  if(changed) {
    return this.funcall(self, 'replace', result);
  } else {
    return Qnil;
  }
});

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

$.define_method($c.Array, 'keep_if', 0, function(self) {
  var block = this.block_lambda();

  for(var i = 0; i < self.length; i++) {
    if(!this.test(this.funcall(block, 'call', self[i]))) {
      self.splice(i, 1);
      i--;
    }
  }

  return self;
});

$.define_method($c.Array, 'last', -1, function(self, args) {
  this.check_args(args, 0, 1);

  if(args[0] == null) {
    return self[self.length - 1];
  } else {
    var n = this.to_int(args[0]);
    if(n > self.length)
      n = self.length;

    return self.slice(self.length - n);
  }
});

$.define_method($c.Array, 'length', 0, function(self) {
  return self.length;
});
$.alias_method($c.Array, 'size', 'length');

$.define_method($c.Array, 'map', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++)
    result.push(this.yield1(self[i]));

  return result;
});
$.alias_method($c.Array, 'collect', 'map');

$.define_method($c.Array, 'map!', 0, function(self) {
  for(var i = 0; i < self.length; i++)
    self[i] = this.yield1(self[i]);

  return self;
});
$.alias_method($c.Array, 'collect!', 'map!');

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
    if(!this.test(this.yield1(self[i])))
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'reject!', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    if(this.test(this.yield1(self[i]))) {
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
    this.yield1(self[i]);

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
    if(this.test(this.yield1(self[i])))
      result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'select!', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    if(!this.test(this.yield1(self[i]))) {
      self.splice(i, 1);
      i--;
    }
  }

  return self;
});

$.define_method($c.Array, 'shift', 0, function(self) {
  return self.shift();
});

$.define_method($c.Array, 'slice', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var index = args[0], length = args[1];

  if(length == null && index.klass != $c.Range) {
    return this.funcall(self, 'at', index);
  } else {
    if(args.length == 2) {
      index = this.to_int(index);
      length = this.to_int(length);
    } else if(index.klass == $c.Range) {
      length = this.to_int(index.ivs['@end']);
      if(length < 0)
        length += self.length + 1;
      length -= (this.test(index.ivs['@excl']) ? 1 : 0);
      index  = this.to_int(index.ivs['@begin']);
      length -= index;
    } else {
      this.raise($c.ArgumentError, "Array#slice requires one or two integers or Range as arguments");
    }

    var step = (length > 0 ? 1 : -1), result = [];
    var neg = (index < 0);

    for(var i = 0; i < length; i += step) {
      if((neg && (index + i >= 0)) || (!neg && (index + i < 0)))
        break;

      if((index + i) < self.length && (index + i) >= -self.length) {
        result.push(this.funcall(self, 'at', index + i));
      }
    }

    return result;
  }
});
$.alias_method($c.Array, '[]', 'slice');

$.define_method($c.Array, 'slice!', -1, function(self, args) {
  this.check_args(args, 1, 1);
  var index = args[0], length = args[1];

  if(length == null && index.klass != $c.Range) {
    return this.funcall(self, 'delete_at', index);
  } else {
    if(args.length == 2) {
      index = this.to_int(index);
      length = this.to_int(length);
    } else if(index.klass == $c.Range) {
      length = this.to_int(index.ivs['@end']);
      if(length < 0)
        length += self.length + 1;
      length -= (this.test(index.ivs['@excl']) ? 1 : 0);
      index  = this.to_int(index.ivs['@begin']);
      length -= index;
    } else {
      this.raise($c.ArgumentError, "Array#slice! requires one or two integers or Range as arguments");
    }

    var step = (length > 0 ? 1 : -1), result = [];
    var neg = (index < 0);

    for(var i = 0; i < length; i += step) {
      if((neg && (index + i >= 0)) || (!neg && (index + i < 0)))
        break;

      if((index + i) < self.length && (index + i) >= -self.length) {
        result.push(this.funcall(self, 'delete_at', index + i));
      }
    }

    return result;
  }
});

$.define_method($c.Array, 'take', 1, function(self, n) {
  n = this.to_int(n);
  if(n < 0) n = 0;

  return self.slice(0, n);
});

$.define_method($c.Array, 'take_while', 0, function(self) {
  var result = [], drop = true;

  for(var i = 0; i < self.length; i++) {
    if(this.test(this.yield1(self[i]))) {
      result.push(self[i]);
    } else break;
  }

  return result;
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

$.define_method($c.Array, 'uniq', 0, function(self) {
  var result = [];

  for(var i = 0; i < self.length; i++) {

    var go = true;
    for(var j = 0; j < result.length; j++) {
      if(this.test(this.funcall(self[i], '==', result[j]))) {
        go = false;
        break;
      }
    }

    if(!go) continue;

    result.push(self[i]);
  }

  return result;
});

$.define_method($c.Array, 'uniq!', 0, function(self) {
  return this.funcall(self, 'replace', this.funcall(self, 'uniq'));
});

$.define_method($c.Array, 'values_at', -1, function(self, args) {
  var result = [];

  var adder = function(n) {
    if(n < self.length && n >= -self.length) {
      if(n < 0)
        n = self.length + n;

      result.push(self[n]);
    } else {
      result.push(Qnil);
    }
  }

  for(var i = 0; i < args.length; i++) {
    this.check_type(args[i], [$c.Fixnum, $c.Range]);

    if(args[i].klass == $c.Fixnum) {
      adder(args[i]);
    } else if(args[i].klass == $c.Range) {
      var begin = this.to_int(args[i].ivs['@begin']);
      var end = this.to_int(args[i].ivs['@end']);
      if(this.test(args[i].ivs['@excl']))
        end--;

      for(var j = begin; j <= end; j++)
        adder(j);
    }
  }

  return result;
});

$.define_method($c.Array, '|', 1, function(self, other) {
  return this.funcall(this.funcall(self, '+', this.to_ary(other)), 'uniq');
});

Array.prototype.klass = $c.Array;
