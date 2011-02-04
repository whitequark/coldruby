$.define_method($c.Object, 'initialize', 0, function(self) {
});

$.define_method($c.Kernel, 'nil?', 0, function(self) {
  return Qfalse;
});

$.define_method($c.Kernel, '=~', 1, function(self, other) {
  return Qnil;
});

$.define_method($c.Kernel, '!~', 1, function(self, other) {
  return $.test(this.funcall(self, '=~', other)) ? Qfalse : Qtrue;
});

$c.Kernel.instance_methods[$.any2id('===')] =
          $c.BasicObject.instance_methods[$.any2id('==')];

$.define_method($c.Kernel, 'class', 0, function(self) {
  return self.klass;
});

$.define_method($c.Kernel, 'superclass', 0, function(self) {
  return self.superklass == null ? Qnil : self.superklass;
});

// This complete method is an example of how _not_ to do
// hash-functions, but it's the best I can think of now.
$.define_method($c.Kernel, 'hash', 0, function(self) {
  return self.toString();
});

$.define_method($c.Kernel, 'to_s', 0, function(self) {
  return "#<" + self.klass.klass_name + ">";
});

$.define_method($c.Kernel, 'inspect', 0, function(self) {
  return this.funcall(self, 'to_s');
});
