$.define_module('Enumerable');

$.define_method($c.Enumerable, 'to_a', -1, function(self, args) {
  var array = [];
  var iterator = function(self, args) {
    if(args.length == 1) args = args[0];
    array.push(args);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return array;
});
$.alias_method($c.Enumerable, 'entries', 'to_a');

$c.Enumerable.make_truth_checker = function() {
  var checker;

  if(this.block_given_p()) {
    var block = this.block_proc();
    checker = function(args) {
      return this.test(this.funcall2(block, 'call', args));
    }
  } else {
    checker = function(args) {
      if(args.length > 1)
        return true;
      return this.test(args[0]);
    }
  }

  return checker;
}

$.define_method($c.Enumerable, 'any?', 0, function(self) {
  var retval = Qfalse, checker = $c.Enumerable.make_truth_checker.call(this);

  var iterator = function(self, args) {
    if(checker.call(this, args)) {
      retval = Qtrue;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return retval;
});

$.define_method($c.Enumerable, 'all?', 0, function(self) {
  var retval = Qtrue, checker = $c.Enumerable.make_truth_checker.call(this);

  var iterator = function(self, args) {
    if(!checker.call(this, args)) {
      retval = Qfalse;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return retval;
});

$.define_method($c.Enumerable, 'map', 0, function(self) {
  var result = [], block = this.block_lambda();

  var iterator = function(self, args) {
    result.push(this.funcall2(block, 'call', args));

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return result;
});
$.alias_method($c.Enumerable, 'collect', 'map');

$.define_method($c.Enumerable, 'count', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var elem = args[0], block;

  if(elem == null && this.block_given_p())
    block = this.block_lambda();

  var count = 0;
  var iterator = function(self, args) {
    if(elem != null) {
      if(args.length == 1) args = args[0];
      if(this.test(this.funcall(args, '==', elem)))
        count++;
    } else if(block != null) {
      if(this.test(this.funcall2(block, 'call', args)))
        count++;
    } else count++;

    return Qnil;
  }

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return count;
});

$.define_method($c.Enumerable, 'drop', 1, function(self, n) {
  var result = [];
  n = this.to_int(n);

  var iterator = function(self, args) {
    if(n > 0) {
      n--;
    } else if(n == 0) {
      $c.Enumerable.multi_push(result, args);
    } else this.iter_break();

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return result;
});

$.define_method($c.Enumerable, 'drop_while', 0, function(self) {
  var result = [], block = this.block_lambda();
  var do_drop = true;

  var iterator = function(self, args) {
    if(do_drop) {
      if(!this.test(this.funcall2(block, 'call', args)))
        do_drop = false;
    }

    if(!do_drop) {
      if(args.length == 1) args = args[0];
      result.push(args);
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return result;
});

$.define_method($c.Enumerable, 'each_with_index', -1, function(self, args) {
  var block = this.block_lambda(), index = 0;

  var iterator = function(self, args) {
    if(args.length == 1) args = args[0];
    this.funcall(block, 'call', args, index);
    index++;

    return Qnil;
  };

  this.funcall2(self, 'each', args, this.lambda(iterator, 1));

  return self;
});

$.define_method($c.Enumerable, 'each_with_object', 1, function(self, memo) {
  var block = this.block_lambda();

  var iterator = function(self, args) {
    if(args.length != 1) args = [args];
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

  var iterator = function(self, args) {
    this.funcall2(block, 'call', args);

    return Qnil;
  };

  while(n == Qnil || n > 0) {
    this.funcall2(self, 'each', [], this.lambda(iterator, -1));

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
  var iterator = function(self, args) {
    if(this.test(this.funcall2(block, 'call', args))) {
      if(args.length == 1) args = args[0];
      memo = args;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

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

  var iterator = function(self, args) {
    if(this.test(this.funcall2(block, 'call', args)))
      result.push(object);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return result;
});
$.alias_method($c.Enumerable, 'select', 'find_all');

$.define_method($c.Enumerable, 'find_index', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var value = args[0], block, index = 0, found = false;

  if(value == null)
    block = this.block_lambda();

  var iterator = function(self, args) {
    if((value != null && this.test(this.funcall(value, '==', args.length == 1 ? args[0] : args))) ||
       (block != null && this.test(this.funcall2(block, 'call', args)))) {
      found = true;
      this.iter_break();
    }

    index++;

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return found ? index : Qnil;
});

$.define_method($c.Enumerable, 'first', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var count = args[0];

  if(count == null) {
    var elem = Qnil;
    var iterator = function(self, args) {
      elem = args;

      this.iter_break();
    };

    this.funcall2(self, 'each', [], this.lambda(iterator, -1));

    if(elem.length == 1) elem = elem[0];
    return elem;
  } else {
    count = this.to_int(count);

    var array = [];
    var iterator = function(self, args) {
      count -= 1;
      if(count < 0) this.iter_break();

      if(args.length == 1) args = args[0];
      array.push(args);

      return Qnil;
    }

    this.funcall2(self, 'each', [], this.lambda(iterator, -1));

    return array;
  }
});

$.define_method($c.Enumerable, 'group_by', 0, function(self) {
  var block = this.block_lambda();
  var hash = this.funcall($c.Hash, 'new');

  var iterator = function(self, args) {
    var key = this.funcall2(block, 'call', args);

    var array = this.funcall(hash, '[]', key);
    if(array == Qnil) {
      array = [];
      this.funcall(hash, '[]=', key, array);
    }

    if(args.length == 1) args = args[0];
    array.push(args);

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return hash;
});

$.define_method($c.Enumerable, 'include?', 1, function(self, needle) {
  var retval = Qfalse;

  var iterator = function(self, args) {
    if(args.length == 1) args = args[0];

    if(this.test(this.funcall(args, '==', needle))) {
      retval = Qtrue;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

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

  var iterator = function(self, args) {
    if(args.length == 1) args = args[0];

    if(initial == null) {
      initial = args;
    } else if(block) {
      initial = this.funcall(block, 'call', initial, args);
    } else {
      initial = this.funcall(initial, sym, args);
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return initial;
});
$.alias_method($c.Enumerable, 'reduce', 'inject');

$c.Enumerable.minmax_checker = function(self, direction, by) {
  var comparator;

  if(this.block_given_p() && !by) {
    var block = this.block_proc();
    comparator = function(a, b, dir) {
      return (this.to_int(this.funcall(block, 'call', a, b)) * dir) < 0;
    }
  } else {
    var ruby = this;
    comparator = function(a, b, dir) {
      return (this.to_int(this.funcall(a, '<=>', b)) * dir) < 0;
    }
  }

  var min = Qnil, max = Qnil;
  var minby = null, maxby = null;

  var iterator = function(self, args) {
    if(by)
      var mapped = this.yield2(args);

    if(args.length == 1) args = args[0];

    if(direction == 0 || direction == 1) {
      if(max == Qnil || comparator.call(this, maxby != null ? maxby : max,
                                             mapped != null ? mapped : args, 1)) {
        max = args;
        maxby = mapped;
      }
    }

    if(direction == 0 || direction == -1) {
      if(min == Qnil || comparator.call(this, minby != null ? minby : min,
                                             mapped != null ? mapped : args, -1)) {
        min = args;
        minby = mapped;
      }
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  if(direction == 1) {
    return max;
  } else if(direction == -1) {
    return min;
  } else {
    return [min, max];
  }
}

$.define_method($c.Enumerable, 'max', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, 1, false);
});

$.define_method($c.Enumerable, 'max_by', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, 1, true);
});

$.define_method($c.Enumerable, 'min', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, -1, false);
});

$.define_method($c.Enumerable, 'min_by', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, -1, true);
});

$.define_method($c.Enumerable, 'minmax', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, 0, false);
});

$.define_method($c.Enumerable, 'minmax_by', 0, function(self) {
  return $c.Enumerable.minmax_checker.call(this, self, 0, true);
});

$.define_method($c.Enumerable, 'none?', 0, function(self) {
  var retval = Qtrue, checker = $c.Enumerable.make_truth_checker.call(this);

  var iterator = function(self, args) {
    if(checker.call(this, args)) {
      retval = Qfalse;
      this.iter_break();
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return retval;
});

$.define_method($c.Enumerable, 'one?', 0, function(self) {
  var retval = Qfalse, checker = $c.Enumerable.make_truth_checker.call(this);

  var iterator = function(self, args) {
    if(checker.call(this, args)) {
      if(retval == Qfalse) {
        retval = Qtrue;
      } else {
        retval = Qfalse;
        this.iter_break();
      }
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return retval;
});

$.define_method($c.Enumerable, 'partition', 0, function(self) {
  var true_array = [], false_array = [];
  var block = this.block_proc();

  var iterator = function(self, args) {
    var a_args = args;
    if(args.length == 1) args = args[0];

    if(this.test(this.funcall2(block, 'call', a_args))) {
      true_array.push(args);
    } else {
      false_array.push(args);
    }

    return Qnil;
  }

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return [true_array, false_array];
});

$.define_method($c.Enumerable, 'reject', 0, function(self) {
  var block = this.block_proc(), result = [];

  var iterator = function(self, args) {
    if(!this.test(this.funcall2(block, 'call', args))) {
      if(args.length == 1) args = args[0];
      result.push(args);
    }

    return Qnil;
  };

  this.funcall2(self, 'each', [], this.lambda(iterator, -1));

  return result;
});
