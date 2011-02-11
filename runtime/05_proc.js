$.define_class('Proc');

$.builtin.make_proc = function(iseq) {
  return {
    klass: $c.Proc,
    iseq:  iseq,
  }
}

$.define_method($c.Proc, 'initialize', 0, function(self) {
  if(this.block_given()) {
    self.iseq = this.context.sf.block;
  } else if(this.context.sf.parent.parent.block) { // Proc#initialize->Proc.new->caller
    self.iseq = this.context.sf.parent.parent.block;
  } else {
    this.raise(this.e.ArgumentError, "tried to create Proc object without a block");
  }

  if(self.iseq.lambda == undefined) {
    self.iseq.lambda = false;
  }
});

$.define_method($c.Proc, 'call', -1, function(self, args) {
  var sf = self.iseq.stack_frame;

  var sf_opts = {
    self: sf.self,
    ddef: sf.ddef,
    cref: sf.cref,

    outer: sf,
  };

  return this.execute(sf_opts, self.iseq, args)
});
$.alias_method($c.Proc, 'yield', 'call');
$.alias_method($c.Proc, '[]', 'call');
$.alias_method($c.Proc, '===',   'call');

$.define_method($c.Proc, 'lambda?', 0, function(self) {
  if(typeof self.iseq != 'object') {
    // native method as a proc
    return Qtrue;
  }

  return self.iseq.lambda ? Qtrue : Qfalse;
});

$.define_method($c.Proc, 'to_proc', 0, function(self) {
  return self;
});

$.define_method($c.Proc, 'to_s', 0, function(self) {
  var desc = '#<Proc:' + self.iseq.info.file + '@' + self.iseq.info.line;
  if(self.iseq.lambda) {
    desc += ' (lambda)';
  }
  return desc + '>';
});
