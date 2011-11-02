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

$.define_method($c.String, '==', 1, function(self, other) {
  other = this.to_str(other);

  return (self.value == other.value) ? Qtrue : Qfalse;
});

$.define_method($c.String, 'to_str', 0, function(self) {
  return self;
});
$.alias_method($c.String, 'to_s', 'to_str');

$.define_method($c.String, 'length', 0, function(self) {
  return self.value.length;
});
$.alias_method($c.String, 'size', 'length');

$.define_method($c.String, 'concat', 1, function(self, other) {
  self.value += this.to_str(other).value;

  return self;
});
$.alias_method($c.String, '<<', 'concat');

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

$.define_method($c.String, 'to_sym', 0, function(self) {
  return $.text2sym(self.value);
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
