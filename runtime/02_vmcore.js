$.builtin.vmcore = {
  singleton_methods: {
    'core#define_method': function(args) {
      $.check_args(args, 3);
      $.check_type(args[1], $c.Symbol);
      $.check_type(args[2], $c.ISeq);

      if(!args[0].toplevel) {
        $.check_type(args[0], $c.Class);
        $.define_method(args[0], args[1].string, args[2]);
      } else {
        $.define_method($c.Object, args[1].string, args[2]);
      }

      return Qnil;
    },

    'core#define_singleton_method': function(args) {
      $.check_args(args, 3);
      $.check_type(args[1], $c.Symbol);
      $.check_type(args[2], $c.ISeq);

      $.define_singleton_method(args[0], args[1].string, args[2]);

      return Qnil;
    },

    'core#set_method_alias': function(args) {
      $.check_args(args, 3);
      $.check_type(args[0], $c.Class);
      $.check_type(args[1], $c.Symbol);
      $.check_type(args[2], $c.Symbol);
    }
  }
}
