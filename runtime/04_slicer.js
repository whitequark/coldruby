$.slicer = function(self_length, args, getter) {
  this.check_args(args, 1, 1);
  var index = args[0], length = args[1];

  if(length == null && index.klass != $c.Range) {
    return getter.apply(this, [ index ]);
  } else {
    if(args.length == 2) {
      index = this.to_int(index);
      length = this.to_int(length);
    } else if(index.klass == $c.Range) {
      length = this.to_int(index.ivs['@end']);
      if(length < 0) {
        length += self_length + 1;
      } else {
        length += 1;
      }
      length -= (this.test(index.ivs['@excl']) ? 1 : 0);
      index  = this.to_int(index.ivs['@begin']);
      length -= index;
    } else {
      this.raise($c.ArgumentError, "slice requires one or two integers or Range as arguments");
    }

    var step = (length > 0 ? 1 : -1), result = [];
    var neg = (index < 0);

    for(var i = 0; i < length; i += step) {
      if((neg && (index + i >= 0)) || (!neg && (index + i < 0)))
        break;

      if((index + i) < self_length && (index + i) >= -self_length) {
        result.push(getter.apply(this, [ index + i ]));
      }
    }

    return result;
  }
}