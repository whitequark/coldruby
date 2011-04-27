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

$.define_method($c.Enumerable, 'count', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var elem = args[0], block;

  if(elem == null && this.block_given_p())
    block = this.block_lambda();

  var count = 0;
  var iterator = function(self, object) {
    if(elem != null) {
      if(this.test(this.funcall(object, '==', elem)))
        count++;
    } else if(block != null) {
      if(this.test(this.funcall(block, 'call', object)))
        count++;
    } else count++;
  }

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return count;
});

$.define_method($c.Enumerable, 'drop', 1, function(self, n) {
  var result = [];
  n = this.to_int(n);

  var iterator = function(self, object) {
    if(n > 0) {
      n--;
    } else if(n == 0) {
      result.push(object);
    } else this.iter_break();
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});

$.define_method($c.Enumerable, 'drop_while', 0, function(self) {
  var result = [], block = this.block_lambda();
  var do_drop = true;

  var iterator = function(self, object) {
    if(do_drop) {
      if(!this.test(this.funcall(block, 'call', object)))
        do_drop = false;
    }

    if(!do_drop)
      result.push(object);
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});

$.define_method($c.Enumerable, 'each_with_index', -1, function(self, args) {
  var block = this.block_lambda(), index = 0;

  var iterator = function(self, object) {
    this.funcall(block, 'call', object, index);
    index++;
  };

  this.funcall2(self, 'each', args, this.lambda(iterator, 1));

  return self;
});

$.define_method($c.Enumerable, 'each_with_object', 1, function(self, memo) {
  var block = this.block_lambda();

  var iterator = function(self, args) {
    args.push(memo);
    this.funcall2(block, 'call', args);
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return memo;
});

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
$.alias_method($c.Enumerable, 'detect', 'find');

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

