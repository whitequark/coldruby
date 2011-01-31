$.define_builtin_class('String', $c.Object);
$.define_method($c.String, 'to_s', function(args) {
  return this;
});

String.prototype.klass = $c.String;