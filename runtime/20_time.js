$.define_class('Time');

$.define_singleton_method($c.Time, 'now', 0, function() {
  return $.float_new($i.time_now());
});
