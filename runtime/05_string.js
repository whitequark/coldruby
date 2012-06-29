$.define_class('String', $c.Object);
$.module_include($c.String, $c.Comparable);

$.builtin.string_proto = {
  toString: function() {
    return this.value;
  }
};

$.string_new = function(value) {
  return {
    __proto__: $.builtin.string_proto,
    klass: $c.String,
    value: value,
  };
};

$.define_singleton_method($c.String, 'new', 1, function(self, str) {
  return this.string_new(str.value);
});

$.define_method($c.String, '+', 1, function(self, other) {
  return this.string_new(self + this.to_str(other).value);
});

$.define_method($c.String, '*', 1, function(self, count) {
  count = this.to_int(count);

  var result = "";
  for(var i = 0; i < count; i++)
    result += self.value;

  return this.string_new(result);
});

$.define_method($c.String, '==', 1, function(self, other) {
  if(this.respond_to(other, 'to_str')) {
    other = this.to_str(other);

    return (self.value == other.value) ? Qtrue : Qfalse;
  } else {
    return this.funcall(self, '<=>', other) == 0 ? Qtrue : Qfalse;
  }
});

$.define_method($c.String, '<=>', 1, function(str, str2) {
  if(str2.klass != $c.String) {
    if(!this.respond_to(str2, 'to_str'))
      return Qnil;

    if(!this.respond_to(str2, '<=>'))
      return Qnil;

    var tmp = this.funcall(str2, '<=>', str);
    if(typeof tmp != "number")
      return Qnil;

    return -tmp;
  } else {
    return str.value.localeCompare(str2.value);
  }
});

$.define_method($c.String, '=~', 1, function(self, obj) {
  return this.funcall(obj, '=~', self);
});

$.define_method($c.String, '[]', -1, function(self, args) {
  var set = this.slicer(self.value.length, args, function(index) {
    return self.value[index];
  });

  if(typeof set == "string") {
    return this.string_new(set);
  } else {
    return this.string_new(set.join(""));
  }
});

$.define_method($c.String, '[]=', 2, function(self, index, sub) {
  index = this.to_int(index);
  sub   = this.to_str(sub);

  var value = self.value;
  value = value.slice(0, index) + sub + value.slice(index, -1);
  self.value = value;

  return self;
});

$.define_method($c.String, 'capitalize', 0, function(self) {
  var copy = this.string_new(self.value);
  this.funcall(copy, 'capitalize!');
  return copy;
});

$.define_method($c.String, 'capitalize!', 0, function(self) {
  var value = self.value, old_value = value;
  value = value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
  self.value = value;

  return (value == old_value) ? Qnil : self;
});

$.define_method($c.String, 'concat', 1, function(self, other) {
  self.value += this.to_str(other).value;

  return self;
});
$.alias_method($c.String, '<<', 'concat');

$.define_method($c.String, 'hash', 0, function(self) {
  return $.hash(self.klass.hash_seed, self.value);
});

$c.String.replacements = [];
for(var i = 0; i < 0x20; i++) {
  var rightHex = i.toString(16), leftHex = ("0000").substr(0, rightHex);
  var hex = "\\u" + leftHex + rightHex, re = new RegExp(hex, 'g');
  $c.String.replacements.push(re);
}

$.define_method($c.String, 'inspect', 0, function(self) {
  var value = self.value.replace(/"/g, '\\"');

  for(var i = 0; i < $c.String.replacements.length; i++) {
    var re = $c.String.replacements[i];
    value = value.replace(re, re.source);
  }

  return this.string_new('"' + value + '"');
});

$.define_method($c.String, 'length', 0, function(self) {
  return self.value.length;
});
$.alias_method($c.String, 'size', 'length');

$.define_method($c.String, 'split', -1, function(self, args) {
  this.check_args(args, 0, 2);
  var pattern = args[0] || this.gvar_get("$;");
  var limit = args[1] ? this.to_int(args[1]) : 0;
  var do_trim = true, do_remove_null = true; // not actually null, but called so in docs

  if(pattern == Qnil ||
        (pattern.klass == $c.String && pattern.value == " ")) {
    pattern = ' ';
  } else {
    pattern = this.to_str(pattern).value;
    do_trim = false;
  }

  if(limit < 0) {
    limit = 0;
    do_remove_null = false;
  }

  var parts = [];

  if(limit == 0) {
    parts = self.value.split(pattern);
  } else {
    parts = self.value.split(pattern, limit - 1);
    var last = self.value.substr(parts.join(pattern).length);
  }

  if(do_trim) {
    parts = parts.map(function(part) {
      return part.trim();
    });
  }

  if(last) {
    if(do_trim)
      last = last.trimLeft();
    parts.push(last);
  }

  if(do_remove_null) {
    while(parts.lastIndexOf("") == parts.length - 1) {
      parts.pop();
    }
  }

  var ruby = this;
  return parts.map(function(part) {
    return ruby.string_new(part);
  });
});

$.define_method($c.String, 'to_i', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var base = 10;
  if(args[0]) {
    base = this.to_int(args[0]);
    if(base < 2 || base > 36)
      this.raise($e.ArgumentError, "invalid radix " + base);
  }

  return parseInt(self.value, base);
});

$.define_method($c.String, 'to_str', 0, function(self) {
  return self;
});
$.alias_method($c.String, 'to_s', 'to_str');

$.define_method($c.String, 'to_sym', 0, function(self) {
  return $.text2sym(self.value);
});
$.alias_method($c.String, 'intern', 'to_sym');