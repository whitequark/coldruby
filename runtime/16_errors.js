$.define_class('StandardError',  $e.Exception);
$.define_class('RuntimeError',   $e.StandardError);
$.define_class('ArgumentError',  $e.StandardError);
$.define_class('LocalJumpError', $e.StandardError);
$.define_class('IOError',        $e.StandardError);
$.define_class('IndexError',     $e.StandardError);
$.define_class('KeyError',       $e.StandardError);
$.define_class('RangeError',     $e.StandardError);
$.define_class('RegexpError',    $e.StandardError);
$.define_class('TypeError',      $e.StandardError);
$.define_class('ZeroDivisionError', $e.StandardError);

$.define_class('NameError',     $e.StandardError);
$.attr('reader', $e.NameError, 'name');
$.define_method($e.NameError, 'initialize', -1, function(self, args) {
  this.check_args(args, 1, 1);
  this.super(args[0]);

  this.ivs['@name'] = args[1] || Qnil;
});

$.define_class('NoMethodError', $e.NameError);
$.attr('reader', $e.NoMethodError, 'args');
$.define_method($e.NoMethodError, 'initialize', -1, function(self, args) {
  this.check_args(args, 2, 1);
  this.super(args[0], args[1]);

  this.ivs['@args'] = args
});

$.define_class('ScriptError',         $e.StandardError);
$.define_class('NotImplementedError', $e.ScriptError);
$.define_class('LoadError',           $e.ScriptError);
$.define_class('SyntaxError',         $e.ScriptError);

$.define_class('StopIteration',       $e.IndexError);
$.attr('reader', $e.StopIteration, 'result');

$.define_class('SystemExit', $e.Exception);
$.attr('reader', $e.SystemExit, 'status');
$.define_method($e.SystemExit, 'initialize', -1, function(self, args) {
  this.check_args(args, 0, 1);
  this.ivs['@status'] = args[0] || 0;
});
$.define_method($e.SystemExit, 'success?', 0, function(self) {
  return this.ivs['@status'] == 0 ? Qtrue : Qfalse;
});
