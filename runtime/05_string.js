$.define_class('String', $c.Object);
$.module_include($c.String, $c.Comparable);

$.define_method($c.String, 'to_str', 0, function(self) {
  return self;
});
$.alias_method($c.String, 'to_s', 'to_str');

$.define_method($c.String, 'to_sym', 0, function(self) {
  return $.text2sym(self);
});

$.define_method($c.String, 'inspect', 0, function(self) {
  return '"' + self + '"';
});

$.define_method($c.String, '+', 1, function(self, other) {
  return self + this.to_str(other);
});

$.define_method($c.String, '*', 1, function(self, count) {
  count = this.to_int(count);

  var result = "";
  for(var i = 0; i < count; i++)
    result += self;

  return result;
});

String.prototype.klass = $c.String;
