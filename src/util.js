define('util', [], function () {

  var util = {};

  util.extend = function (dest, source, setter) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof setter === 'function') {
          setter(key, source[key], dest, source);
        } else {
          dest[key] = source[key];
        }
      }
    }
    return dest;
  };

  util.rand = function (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  util.randFloat = function (min, max) {
    return min + (Math.random() * (max - min));
  };

  var _uniqueId = 0;
  util.uniqueId = function () {
    return _uniqueId++;
  };

  return util;

});
