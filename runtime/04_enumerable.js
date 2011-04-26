$.define_module('Enumerable');

$.define_method($c.Enumerable, 'to_a', -1, function(self, args) {
  var array = [];
  var iterator = function(self, args) {
    array.append(args[0]);

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
  var iterator = function(self, args) {
    var obj = args[0];

    if(this.test(this.funcall(block, 'call', obj))) {
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

  var iterator = function(self, args) {
    if(args[0] == needle) {
      retval = Qtrue;
      this.iter_break();
    }
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});
