$.define_module('Enumerable');

$.define_method($c.Enumerable, 'to_a', -1, function(self, args) {
  var array = [];
  var iterator = function(self, object) {
    array.append(object);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return array;
});
$.alias_method($c.Enumerable, 'entries', 'to_a');

$.define_method($c.Enumerable, 'find', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var if_none = args[0];

  var block = this.block_proc();

  var memo = null;
  var iterator = function(self, object) {
    if(this.test(this.funcall(block, 'call', object))) {
      memo = obj;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  if(memo) {
    return memo;
  } else {
    if(if_none) {
      return this.funcall(if_none, 'call');
    } else {
      return Qnil;
    }
  }
});

$.define_method($c.Enumerable, 'include?', 1, function(self, needle) {
  var retval = Qfalse;

  var iterator = function(self, object) {
    if(object == needle) {
      retval = Qtrue;
      this.iter_break();
    }
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});

$.define_method($c.Enumerable, 'any?', 0, function(self) {
  var retval = Qfalse, block;

  if(this.block_given_p())
    block = this.block_lambda();

  var iterator = function(self, object) {
    if(block) object = this.funcall(block, 'call', object);

    if(this.test(object)) {
      retval = Qtrue;
      this.iter_break();
    }
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});

$.define_method($c.Enumerable, 'all?', 0, function(self) {
  var retval = Qtrue, block;

  if(this.block_given_p())
    block = this.block_lambda();

  var iterator = function(self, object) {
    if(block) object = this.funcall(block, 'call', object);

    if(!this.test(object)) {
      retval = Qfalse;
      this.iter_break();
    }
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});

$.define_method($c.Enumerable, 'map', 0, function(self) {
  var result = [], block = this.block_lambda();

  var iterator = function(self, object) {
    result.push(this.funcall(block, 'call', object));
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});
$.alias_method($c.Enumerable, 'collect', 'map');
