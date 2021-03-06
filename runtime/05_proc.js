$.define_class('Proc');

$c.Proc.last_id = 0;

$.proc_new = function() {
  var proc = { klass: $c.Proc };
  this.funcall(proc, 'initialize');

  return proc;
}

$.define_method($c.Proc, 'initialize', 0, function(self) {
  var new_iseq = {}, sf;

  // for hashing
  self.id = self.klass.last_id;
  self.klass.last_id += 1;

  // Proc#initialize->Proc.new->caller
  var outer_sf = this.context.sf.parent.osf;

  if(!outer_sf.block)
    this.raise(this.e.ArgumentError, "tried to create Proc object without a block");

  if(typeof outer_sf.block == "object") {
    /* A regular InstructionSequence */
    for(var name in outer_sf.block)
      new_iseq[name] = outer_sf.block[name];
  } else {
    /* A JavaScript closure. The JS closures created in ColdRuby are always
     * temporary (they're created either by $.to_block() or $.lambda(), so
     * we just muck with existing instance.
     */
    new_iseq = outer_sf.block;
  }

  self.iseq = new_iseq;
  self.iseq.stack_frame = outer_sf.parent;

  if(self.iseq.lambda == undefined) {
    self.iseq.lambda = false;
  }

  return Qnil;
});

$.define_method($c.Proc, 'call', -1, function(self, args) {
  var sf = self.iseq.stack_frame;

  var sf_opts = {
    self: sf.self,
    ddef: sf.ddef,
    cref: sf.cref,

    outer: sf,
  };

  return this.execute(sf_opts, self.iseq, args);
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
  return this.string_new(desc + '>');
});

$.define_method($c.Proc, 'hash', 0, function(self) {
  return $.hash(self.klass.hash_seed, self.id.toString());
});