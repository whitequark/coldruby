$.define_class('Time');

$.define_singleton_method($c.Time, 'now', 0, function() {
  return $.builtin.make_float($i.time_now());
});