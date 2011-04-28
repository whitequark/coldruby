$.define_class('Array', $c.Object);
$.module_include($c.Array, $c.Enumerable);

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

$.define_method($c.Array, 'any?', 0, function(self) {
  return self.length > 0 ? Qtrue : Qfalse;
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

$.define_method($c.Array, 'each', 0, function(self) {
  for(var i = 0; i < self.length; i++) {
    this.yield(self[i]);
  }
  return self;
});

$.define_method($c.Array, 'empty?', 0, function(self) {
  return self.length == 0 ? Qtrue : Qfalse;
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

$.define_method($c.Array, 'pop', 0, function(self) {
  return self.pop();
});

$.define_method($c.Array, 'push', 1, function(self, obj) {
  self.push(obj);

  return self;
});
$.alias_method($c.Array, '<<', 'push');

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
