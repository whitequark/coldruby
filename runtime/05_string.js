$.define_builtin_class('String', $c.Object);

$.define_method($c.String, 'to_s', 0, function(self) {
  return self;
});

String.prototype.klass = $c.String;