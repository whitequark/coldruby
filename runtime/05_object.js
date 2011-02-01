$.define_method($c.Object, 'nil?', 0, function(self) {
  return Qfalse;
});

$.define_method($c.Object, 'to_s', 0, function(self) {
  return "#<" + self.klass.klass_name + ">";
});
$.alias_method($c.Object, 'inspect', 'to_s');
