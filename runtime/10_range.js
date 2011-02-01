$.define_class('Range', $c.Object);

$.define_method($c.Range, 'initialize', -1, function(self, args) {
  $.check_args(args, 2, 1);
  var begin = args[0], end = args[1], excl = args[2];

  self.iv.begin = begin;
  self.iv.end   = end;
  self.iv.excl  = $.test(excl);
});

$.builtin.make_range = function(begin, end, excl) {
  return {
    klass: $c.Range,
    iv: {
      begin: begin,
      end:   end,
      excl:  excl ? Qtrue : Qfalse,
    }
  };
};

$.attr('reader', $c.Range, ['begin', 'end']);

$.define_method($c.Range, 'exclude_end?', 0, function(self) {
  return self.iv.excl;
});

$.define_method($c.Range, '==', 1, function(self, other) {
  return (other.klass == $c.Range && self.iv.begin == other.iv.begin &&
    self.iv.env == other.iv.env && self.iv.excl == other.iv.excl);
});

$.define_method($c.Range, 'eql?', 1, function(self, other) {
  return (other.klass == $c.Range &&
    $.test($.invoke_method(this, self.iv.begin, 'eql?', [other.iv.begin])) &&
    $.test($.invoke_method(this, self.iv.end,   'eql?', [other.iv.end])) &&
    self.iv.excl == other.iv.excl);
});

$.define_method($c.Range, 'to_s', 0, function(self) {
  var begin = $.invoke_method(this, self.iv.begin, 'to_s', []);
  var end   = $.invoke_method(this, self.iv.end,   'to_s', []);
  begin += $.test(self.iv.excl) ? '...' : '..';
  begin += end;
  $.obj_infect(begin, end);
  return begin;
});

$.define_method($c.Range, 'inspect', 0, function(self) {
  var begin = $.invoke_method(this, self.iv.begin, 'inspect', []);
  var end   = $.invoke_method(this, self.iv.end,   'inspect', []);
  return begin + ($.test(self.iv.excl) ? '...' : '..') + end;
});

$.define_method($c.Range, 'include?', 1, function(self, other) {
  throw "not implemented";
});
$.alias_method($c.Range, 'member?', 'include?');
$.alias_method($c.Range, '===', 'include?');
