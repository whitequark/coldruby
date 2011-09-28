$.define_class("MatchData", $c.Object);

$.define_method($c.MatchData, "initialize", 4, function(self, re, string, parts, starts) {
  self.ivs['@pattern'] = re;
  self.ivs['@string']  = this.funcall(this.to_str(string), "freeze");
  self.ivs['@strings'] = this.to_ary(parts);
  self.ivs['@start_indexes'] = this.to_ary(starts);
  self.ivs['@length']  = self.ivs['@strings'].length;

  return self;
});

$.define_method($c.MatchData, "==", 1, function(self, other) {
  return (this.obj_is_kind_of(other, $c.MatchData) &&
     $.test(this.funcall(self.ivs['@pattern'], "==", other.ivs['@pattern'])) &&
     $.test(this.funcall(self.ivs['@strings'], "==", other.ivs['@strings'])))
          ? Qtrue : Qfalse;
});

$.define_method($c.MatchData, "[]", -1, function(self, args) {
  return this.funcall2(self.ivs['@strings'], "[]", args);
});

$.define_method($c.MatchData, "begin", 1, function(self, index) {
  index = this.to_int(index);
  if(index > self.ivs['@start_indexes'].length)
    this.raise($e.IndexError, "index " + index + " out of range");

  return self.ivs['@start_indexes'][index];
});

$.define_method($c.MatchData, "captures", 0, function(self) {
  return this.funcall(self.ivs['@strings'], "[]", this.range_new(1, -1));
});

$.define_method($c.MatchData, "end", 1, function(self, index) {
  index = this.to_int(index);
  if(index > self.ivs['@start_indexes'].lengths)
    this.raise($e.IndexError, "index " + index + " out of range");

  return self.ivs['@start_indexes'][index] +
           self.ivs['@strings'][index].value.length;
});

$.define_method($c.MatchData, "inspect", 0, function(self) {
  var strings = self.ivs['@strings'];

  var parts = [];
  for(var i = 1; i < strings.length; i++) {
    parts.push(i.toString() + ":" + this.funcall(strings[i], 'inspect').value);
  }

  var output = "#<MatchData ";
  output += this.funcall(strings[0], 'inspect').value;

  if(parts.length > 0)
    output += " ";
  output += parts.join(" ") + ">";

  return this.string_new(output);
});

$.define_method($c.MatchData, "length", 0, function(self) {
  return self.ivs['@length'];
});
$.alias_method($c.MatchData, "size", "length");

$.define_method($c.MatchData, "offset", 1, function(self, index) {
  return [ this.funcall(self, "begin", index),
           this.funcall(self, "end", index) ];
});

$.define_method($c.MatchData, "post_match", 0, function(self) {
  return this.string_new(self.ivs['@string'].value.
            substr(self.ivs['@strings'][0].value.length +
                   self.ivs['@start_indexes'][0]));
});

$.define_method($c.MatchData, "pre_match", 0, function(self) {
  return this.string_new(self.ivs['@string'].value.
            substr(0, self.ivs['@start_indexes'][0]));
});

$.define_method($c.MatchData, "regexp", 0, function(self) {
  return self.ivs['@pattern'];
});

$.define_method($c.MatchData, "string", 0, function(self) {
  return self.ivs['@string'];
});

$.define_method($c.MatchData, "to_a", 0, function(self) {
  return self.ivs['@strings'];
});

$.define_method($c.MatchData, "to_s", 0, function(self) {
  return self.ivs['@strings'][0];
});

$.define_method($c.MatchData, "values_at", -1, function(self, args) {
  return this.funcall2(self.ivs['@strings'], "values_at", args);
});
