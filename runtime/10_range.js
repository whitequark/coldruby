$.define_class('Range', $c.Object);
$.module_include($c.Range, $c.Enumerable);

$.define_method($c.Range, 'initialize', -1, function(self, args) {
  this.check_args(args, 2, 1);
  var begin = args[0], end = args[1], excl = args[2];

  self.ivs['@begin'] = begin;
  self.ivs['@end']   = end;
  self.ivs['@excl']  = $.test(excl);
});

$.range_new = function(begin, end, excl) {
  return {
    klass: $c.Range,
    ivs: {
      '@begin': begin,
      '@end':   end,
      '@excl':  excl ? Qtrue : Qfalse,
    }
  };
};

$.attr('reader', $c.Range, ['begin', 'end']);

$.define_method($c.Range, 'exclude_end?', 0, function(self) {
  return self.ivs['@excl'];
});

$.define_method($c.Range, '==', 1, function(self, other) {
  return (other.klass == $c.Range &&
          $.test(this.funcall(self.ivs['@begin'], '==', other.ivs['@begin'])) &&
          $.test(this.funcall(self.ivs['@end'],   '==', other.ivs['@end'])) &&
          self.iv.excl == other.iv.excl);
});

$.define_method($c.Range, 'eql?', 1, function(self, other) {
  return (other.klass == $c.Range &&
    $.test(this.funcall(self.ivs['@begin'], 'eql?', other.iv.begin)) &&
    $.test(this.funcall(self.ivs['@end'],   'eql?', other.iv.end)) &&
    self.iv.excl == other.iv.excl);
});

$.define_method($c.Range, 'to_s', 0, function(self) {
  var begin = this.funcall(self.ivs['@begin'], 'to_s').value;
  var end   = this.funcall(self.ivs['@end'], 'to_s').value;
  begin += $.test(self.ivs['@excl']) ? '...' : '..';
  begin += end;
  $.obj_infect(begin, end);
  return this.string_new(begin);
});

$.define_method($c.Range, 'each', 0, function(self) {
  var i;

  if((typeof self.ivs['@begin'] == "number") &&
      (typeof self.ivs['@end'] == "number")) {
    var last = this.test(self.ivs['@excl']) ? self.ivs['@end'] - 1 : self.ivs['@end'];
    for(i = self.ivs['@begin']; i <= last; i++)
      this.yield1(i);
  } else {
    if(!this.respond_to(self.ivs['@begin'], 'succ'))
      this.raise($e.TypeError, 'can\'t iterate from ' +
            this.obj_classname(self.ivs['@begin']));

    var i = self.ivs['@begin'];
    while(!this.test(this.funcall(i, '==', self.ivs['@end']))) {
      this.yield1(i);

      i = this.funcall(i, 'succ');
    }

    if(!this.test(self.ivs['@excl']))
      this.yield1(i);
  }

  return self;
});

$.define_method($c.Range, 'first', -1, function(self, args) {
  this.check_args(args, 0, 1);
  var count = args[0];

  if(count == null) {
    return self.ivs['@begin'];
  } else {
    count = this.to_int(count);

    var array = [];
    var iterator = function(self, object) {
      count -= 1;
      if(count < 0) this.iter_break();

      array.push(object);
    };

    this.funcall2(self, 'each', [], this.lambda(iterator, 1));

    return array;
  }
});

$.define_method($c.Range, 'inspect', 0, function(self) {
  var begin = this.funcall(self.ivs['@begin'], 'inspect').value;
  var end   = this.funcall(self.ivs['@end'],   'inspect').value;
  return this.string_new(begin + ($.test(self.ivs['@excl']) ? '...' : '..') + end);
});

$.define_method($c.Range, 'include?', 1, function(self, other) {
  throw "not implemented";
});
$.alias_method($c.Range, 'member?', 'include?');
$.alias_method($c.Range, '===', 'include?');
