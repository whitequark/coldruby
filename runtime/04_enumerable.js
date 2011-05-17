$.define_module('Enumerable');

$.define_method($c.Enumerable, 'to_a', -1, function(self, args) {
  var array = [];
  var iterator = function(self, object) {
    array.push(object);

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

    return Qnil;
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

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});

$.define_method($c.Enumerable, 'map', 0, function(self) {
  var result = [], block = this.block_lambda();

  var iterator = function(self, object) {
    result.push(this.funcall(block, 'call', object));

    return Qnil;
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

    return Qnil;
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

    return Qnil;
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

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});

$.define_method($c.Enumerable, 'each_with_index', -1, function(self, args) {
  var block = this.block_lambda(), index = 0;

  var iterator = function(self, object) {
    this.funcall(block, 'call', object, index);
    index++;

    return Qnil;
  };

  this.funcall2(self, 'each', args, this.lambda(iterator, 1));

  return self;
});

$.define_method($c.Enumerable, 'each_with_object', 1, function(self, memo) {
  var block = this.block_lambda();

  var iterator = function(self, args) {
    args.push(memo);
    this.funcall2(block, 'call', args);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return memo;
});

$.define_method($c.Enumerable, 'cycle', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var n = args[0];
  var block = this.block_lambda();

  if(n == null)
    n = Qnil;
  if(n != Qnil)
    n = this.to_int(n);

  var iterator = function(self, object) {
    this.funcall(block, 'call', object);

    return Qnil;
  };

  while(n == Qnil || n > 0) {
    this.funcall2(self, 'each', [], this.lambda(iterator, 1));

    if(typeof n == "number")
      n--;
  }

  return Qnil;
});

$.define_method($c.Enumerable, 'find', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var if_none = args[0];

  var block = this.block_proc();

  var memo = null;
  var iterator = function(self, object) {
    if(this.test(this.funcall(block, 'call', object))) {
      memo = object;
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

$.define_method($c.Enumerable, 'find_all', 0, function(self, args) {
  var block = this.block_proc(), result = [];

  var iterator = function(self, object) {
    if(this.test(this.funcall(block, 'call', object)))
      result.push(object);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});
$.alias_method($c.Enumerable, 'select', 'find_all');

$.define_method($c.Enumerable, 'find_index', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var value = args[0], block, index = 0, found = false;

  if(value == null)
    block = this.block_lambda();

  var iterator = function(self, object) {
    if((value != null && this.test(this.funcall(value, '==', object))) ||
       (block != null && this.test(this.funcall(block, 'call', object)))) {
      found = true;
      this.iter_break();
    }

    index++;

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return found ? index : Qnil;
});

$.define_method($c.Enumerable, 'first', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var count = args[0];

  if(count == null) {
    var elem = Qnil;
    var iterator = function(self, object) {
      elem = object;
      this.iter_break();

      return Qnil;
    };

    this.funcall2(self, 'each', [], this.lambda(iterator, 1));

    return elem;
  } else {
    count = this.to_int(count);

    var array = [];
    var iterator = function(self, object) {
      count -= 1;
      if(count < 0) this.iter_break();

      array.push(object);

      return Qnil;
    };

    this.funcall2(self, 'each', [], this.lambda(iterator, 1));

    return array;
  }
});

$.define_method($c.Enumerable, 'group_by', 0, function(self) {
  var block = this.block_lambda();
  var hash = this.funcall($c.Hash, 'new');

  var iterator = function(self, object) {
    var key = this.funcall(block, 'call', object);

    var array = this.funcall(hash, '[]', key);
    if(array == Qnil) {
      array = [];
      this.funcall(hash, '[]=', key, array);
    }

    array.push(object);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return hash;
});

$.define_method($c.Enumerable, 'include?', 1, function(self, needle) {
  var retval = Qfalse;

  var iterator = function(self, object) {
    if(object == needle) {
      retval = Qtrue;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return retval;
});

$.define_method($c.Enumerable, 'inject', -1, function(self, args) {
  this.check_args(args, 0, 2);
  var initial, sum, block;

  if(args.length == 2) {
    initial = args[0];
    sym     = args[1];
  } else if(args.length == 1 && this.block_given_p()) {
    initial = args[0];
    block   = this.block_lambda();
  } else if(args.length == 1) {
    sym     = args[0];
  } else {
    block   = this.block_lambda();
  }

  var iterator = function(self, object) {
    if(initial == null) {
      initial = object;
    } else if(block) {
      initial = this.funcall(block, 'call', initial, object);
    } else {
      initial = this.funcall(initial, sym, object);
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return initial;
});
$.alias_method($c.Enumerable, 'reduce', 'inject');

$.define_method($c.Enumerable, 'reject', 0, function(self, args) {
  var block = this.block_proc(), result = [];

  var iterator = function(self, object) {
    if(!this.test(this.funcall(block, 'call', object)))
      result.push(object);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, 1));

  return result;
});

