define('audioContext', [], function () {

  var context = new webkitAudioContext(),
    masterGain = context.createGain();

  // 컨텍스트로 직접 연결하는 마스터 게인을 생성한다.
  masterGain.connect(context.destination);

  return {
    createBufferSource: function (nodeToConnect) {
      var source = context.createBufferSource();
      source.connect(nodeToConnect);
      return source;
    },

    getMasterGain: function () {
      return masterGain;
    },

    createGain: function () {
      // 새로 생성하는 게인노드는 마스터 게인 노드와 연결한다.
      var gainNode = context.createGain();
      gainNode.connect(masterGain);
      return gainNode;
    },

    decodeAudioData: function () {
      context.decodeAudioData.apply(context, arguments);
    },

    getTimeAfter: function (sec) {
      return context.currentTime + (sec || 0);
    },

    getTimeBefore: function (sec) {
      return context.currentTime - (sec || 0);
    }
  };

});