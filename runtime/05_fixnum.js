$.define_builtin_class('Fixnum', $c.Object);
$.define_method($c.Fixnum, 'to_s', function(args) {
  return this.toString();
});
$.define_method($c.Fixnum, '+', function(args) {
  return this + args[0];
});
$.define_method($c.Fixnum, '<', function(args) {
  return this < args[0] ? Qtrue : Qfalse;
});

Number.prototype.klass = $c.Fixnum;