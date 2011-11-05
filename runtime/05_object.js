$.define_method($c.Object, 'initialize', 0, function(self) {
  return Qnil;
});

$.define_method($c.Kernel, 'nil?', 0, function(self) {
  return Qfalse;
});

/*
 * Why not
 *   $.alias_method($c.Kernel, 'eql?', 'equal?'); ?
 * Because of weird inheritance chain.
 */
$c.Kernel.instance_methods[$.any2id('eql?')] =
          $c.BasicObject.instance_methods[$.any2id('equal?')];

$.define_method($c.Kernel, '=~', 1, function(self, other) {
  return Qnil;
});

$.define_method($c.Kernel, '!~', 1, function(self, other) {
  return $.test(this.funcall(self, '=~', other)) ? Qfalse : Qtrue;
});

$c.Kernel.instance_methods[$.any2id('===')] =
          $c.BasicObject.instance_methods[$.any2id('==')];

$.define_method($c.Kernel, 'send', -1, function(self, args) {
  if(args.length < 1)
    this.raise($e.ArgumentError, "Object#send requires at least one argument");

  var message = this.to_sym(args[0]);
  return this.funcall2(self, message, args.slice(1), this.context.sf.block);
});

$.define_method($c.Kernel, 'respond_to?', 1, function(self, symbol) {
  return this.respond_to(self, this.to_sym(symbol)) ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'respond_to_missing?', 2, function(self, symbol, include_private) {
  var symbol = this.to_sym(symbol); // check type
  return Qfalse;
});

$.define_method($c.Kernel, 'class', 0, function(self) {
  return self.klass;
});

$.define_method($c.Kernel, 'singleton_class', 0, function(self) {
  return this.get_singleton(self);
});

$.define_method($c.Kernel, 'extend', 1, function(self, module) {
  this.check_type(module, $c.Module);

  this.funcall(module, 'extend_object', self);

  return self;
});

$.define_method($c.Kernel, 'hash', 0, function(self) {
  var ivs_sorted = [];

  for(var name in self.ivs)
    ivs_sorted.push(name);

  ivs_sorted.sort();

  var hash = self.klass.hash_seed;

  for(var i = 0; i < ivs_sorted.length; i++) {
    var name = ivs_sorted[i];

    hash = $.hash(hash, name);
    hash = $.hash(hash, this.funcall(self.ivs[name], 'hash'));
  }

  return hash;
});

$.define_method($c.Kernel, 'to_s', 0, function(self) {
  return this.string_new("#<" + this.obj_classname(self) + ">");
});

$.define_method($c.Kernel, 'inspect', 0, function(self) {
  return this.funcall(self, 'to_s');
});

$.define_method($c.Kernel, 'instance_of?', 1, function(self, klass) {
  return (self.klass == klass) ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'kind_of?', 1, function(self, klass) {
  return this.obj_is_kind_of(self, klass) ? Qtrue : Qfalse;
});
$.alias_method($c.Kernel, 'is_a?', 'kind_of?');

$.define_method($c.Kernel, 'tap', 0, function(self) {
  this.yield1(self);

  return self;
});

$.define_method($c.Kernel, 'taint', 0, function(self) {
  self.tainted = true;
  return self;
});

$.define_method($c.Kernel, 'untaint', 0, function(self) {
  self.tainted = false;
  return self;
});

$.define_method($c.Kernel, 'tainted?', 0, function(self) {
  return self.tainted ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'trust', 0, function(self) {
  self.trusted = true;
  return self;
});

$.define_method($c.Kernel, 'untrust', 0, function(self) {
  self.trusted = false;
  return self;
});

$.define_method($c.Kernel, 'untrusted?', 0, function(self) {
  return self.trusted ? Qfalse : Qtrue;
});

$.define_method($c.Kernel, 'freeze', 0, function(self) {
  self.frozen = true;
  return self;
});

$.define_method($c.Kernel, 'unfreeze', 0, function(self) {
  self.frozen = false;
  return self;
});

$.define_method($c.Kernel, 'frozen?', 0, function(self) {
  return self.frozen ? Qfalse : Qtrue;
});

$.define_method($c.Kernel, 'instance_variable_defined?', 1, function(self, symbol) {
  symbol = this.to_sym(symbol);

  return self.ivs[this.id2text(this.to_sym(symbol).value)] != null ? Qtrue : Qfalse;
});

$.define_method($c.Kernel, 'instance_variable_get', 1, function(self, symbol) {
  symbol = this.to_sym(symbol);

  var value = self.ivs[this.id2text(this.to_sym(symbol).value)]

  return (typeof value !== "undefined") ? value : Qnil;
});

$.define_method($c.Kernel, 'instance_variable_set', 2, function(self, symbol, value) {
  self.ivs[this.id2text(this.to_sym(symbol).value)] = value;

  return value;
});

$.define_method($c.Kernel, 'remove_instance_variable', 1, function(self, symbol) {
  var id = this.id2text(this.to_sym(symbol).value)

  var value = self.ivs[id];
  delete self.ivs[id];

  return value;
});

$.define_method($c.Kernel, 'instance_variables', 0, function(self) {
  var result = [];

  for(var name in self.ivs) {
    if(self.ivs.hasOwnProperty(name))
      result.push(this.text2sym(name));
  }

  return result;
});
