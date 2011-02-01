$.define_class('String', $c.Object);

$.define_method($c.String, 'to_s', 0, function(self) {
  return self;
});

$.define_method($c.String, 'inspect', 0, function(self) {
  return '"' + self + '"';
});

$.define_method($c.String, '+', 1, function(self, other) {
  return self + other;
});

String.prototype.klass = $c.String;