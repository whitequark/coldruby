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
  other = this.check_convert_type(other, $c.String, 'to_s');

  return self + other;
});

String.prototype.klass = $c.String;
