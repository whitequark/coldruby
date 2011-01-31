function clone(o) {
 if(!o || 'object' !== typeof o)  {
   return o;
 }
 var c = 'function' === typeof o.pop ? [] : {};
 var p, v;
 for(p in o) {
 if(o.hasOwnProperty(p)) {
  v = o[p];
  if(v && 'object' === typeof v) {
    c[p] = clone(v);
  }
  else {
    c[p] = v;
  }
 }
}
 return c;
}

function dump_object(obj, ex)
{
  var od = new Object;
  var result = "";
  var len = 0;

  ex[obj] = true;

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        value = "[ " + value + " ]";
      }
      else if(ex[value] == undefined)
      {
        var ood = dump_object(value, clone(ex));
        value = "{ " + ood.dump + " }";
      }
      else
      {
        value = "<...>";
      }
    } else if(typeof value == 'function') {
      continue;
    }
    result += "'" + property + "' : " + value + ", ";
    len++;
  }
  od.dump = result.replace(/, $/, "");
  od.len = len;

  return od;
}

function pp(object) {
  print(dump_object(object, {}).dump);
}