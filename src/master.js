define('master', [
  'audioContext',
  'makePropertiable'
], function (audioContext, makePropertiable) {

  var obj = {},
    masterGain = audioContext.getMasterGain();

  makePropertiable(obj);

  obj.defineProp('volume', {
    value: 1,
    get: function (currentValue) {
      if (this.get('muted')) {
        return 0;
      }
      return currentValue;
    },
    onset: function (newValue) {
      masterGain.gain.value = newValue;
    }
  });

  obj.defineProp('muted', {
    value: false,
    onset: function (newValue) {
      masterGain.gain.value = this.get('volume');
    }
  });

  return obj;

});