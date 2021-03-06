var cRegexp = $.define_class_under($c.ColdRuby, 'JavascriptRegexp');

cRegexp.IGNORECASE = 1;
$.const_set(cRegexp, "IGNORECASE", cRegexp.IGNORECASE);

cRegexp.EXTENDED = 2;
$.const_set(cRegexp, "EXTENDED", cRegexp.EXTENDED);

cRegexp.MULTILINE = 4;
$.const_set(cRegexp, "MULTILINE", cRegexp.MULTILINE);

$.regexp_new = function(pattern, flags, define_osf) {
  var safe_flags = "m";

  if(flags.indexOf("i") != -1)
    safe_flags += "i";

  return {
    klass:      cRegexp,
    regexp:     new RegExp(pattern, safe_flags),
    define_osf: define_osf
  };
}

$.alias_method($.get_singleton(cRegexp), "compile", "new");
$.define_method(cRegexp, "initialize", -1, function(self, args) {
  this.check_args(args, 1, 1);
  var pattern = args[0], options = args[1];

  if(this.obj_is_kind_of(pattern, cRegexp)) {
    self.regexp = pattern.regexp;
  } else {
    var flags = "m";

    if(typeof options == "number") {
      if(options & cRegexp.IGNORECASE) {
        flags += "i";
      }

      if(options & ~cRegexp.IGNORECASE)
        this.raise($c.RuntimeError, "Regexp flags other than `i' are not supported.");
    }

    self.regexp = new RegExp(pattern, flags);
  }

  return self;
});

$.define_singleton_method(cRegexp, "escape", 1, function(self, str) {
  str = this.to_str(str);

  str = this.string_new(str.value.replace(/([\\^$*+?.()|{}\[\]])/g, '\\$1'));

  return str;
});
$.alias_method($.get_singleton(cRegexp), "quote", "escape");

$.define_singleton_method(cRegexp, "try_convert", 1, function(self, object) {
  if(this.respond_to(object, "to_regexp")) {
    return this.funcall(object, "to_regexp");
  } else {
    return Qnil;
  }
});

$.define_method(cRegexp, "to_regexp", 0, function(self) {
  return self;
});

$.define_method(cRegexp, "==", 1, function(self, other) {
  return this.obj_is_kind_of(other, cRegexp) && other.regexp == self.regexp;
});
$.alias_method(cRegexp, "eql?", "==");

$.define_method(cRegexp, "===", 1, function(self, other) {
  return $.test(this.funcall(self, "=~", other));
});

$.define_method(cRegexp, "=~", 1, function(self, other) {
  var match_data = this.funcall(self, 'match', other);
  if(match_data == Qnil) {
    return match_data;
  } else {
    return this.funcall(match_data, 'begin', 0);
  }
});

$.define_method(cRegexp, "casefold?", 0, function(self) {
  return self.regexp.ignoreCase ? Qtrue : Qfalse;
});

$.define_method(cRegexp, "match", -1, function(self, args) {
  this.check_args(args, 1, 1);
  var other = this.to_str(args[0]).value;
  var pos = args[1] ? this.to_int(args[1]) : 0;

  if(pos > 0) {
    var input = other.substring(pos);
  } else {
    var input = other;
  }

  var js_match = self.regexp.exec(input), ruby_match;

  if(js_match) {
    var parts = [];
    var starts = [js_match.index];

    for(var i = 0; i < js_match.length; i++) {
      if(js_match[i] !== null) {
        parts.push(this.string_new(js_match[i]));
      } else {
        parts.push(Qnil);
      }
    }

    ruby_match = this.funcall($c.MatchData, "new",
                  self, this.string_new(input), parts, starts);
  } else {
    ruby_match = Qnil;
  }

  if(self.define_osf)
    self.define_osf.last_regexp_match = ruby_match;

  return ruby_match;
});

$.define_method(cRegexp, "inspect", 0, function(self) {
  return this.string_new(self.regexp.toString());
});
$.alias_method(cRegexp, "to_s", "inspect");

$.define_method(cRegexp, "options", 0, function(self) {
  var options = 0;

  if(self.regexp.ignoreCase)
    options |= cRegexp.IGNORECASE;

  return options;
});

$.define_method(cRegexp, "source", 0, function(self) {
  return this.string_new(self.regexp.source);
});

$.define_method(cRegexp, "~", 0, function(self) {
  return this.funcall(self, "=~", this.gvar_get("$_"));
});

$.define_method(cRegexp, "hash", 0, function(self) {
  return $.hash(this.klass.hash_seed, self.regexp.toString());
});

$.const_set(Qnil, "Regexp", cRegexp);

$.regexp_last_match_op = function(method, args) {
  var match_data = this.context.sf.osf.last_regexp_match;
  if(!match_data || match_data == Qnil)
    return Qnil;

  if(method) {
    return this.funcall2(match_data, method, args);
  } else {
    return match_data;
  }
}

$.gvar_special("$~", {
  get: function() { return this.regexp_last_match_op(); }
});

$.gvar_special("$&", {
  get: function() { return this.regexp_last_match_op('[]', [0]); }
});

$.gvar_special("$`", {
  get: function() { return this.regexp_last_match_op('pre_match', []); }
});

$.gvar_special("$'", {
  get: function() { return this.regexp_last_match_op('post_match', []); }
});
