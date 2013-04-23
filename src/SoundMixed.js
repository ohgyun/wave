define('SoundMixed', [
  'audioContext',
  'makePropertiable',
  'util'
], function (audioContext, makePropertiable, util) {

  /**
   * 여러 사운드를 재료로 믹스한 사운드를 생성한다.
   *
   * NOTE: Sound 와 동일하게, 이 생성자를 직접 사용하지 않는다.
   * Wave.mix()가 팩토리 역할을 하며, 이 생성자 또한 사용자에게 노출되지 않는다.
   *
   * @param {String} name 사운드 이름
   * @param {Array<Sound|SoundMixed>} soundsToMix 믹스할 사운드 재료
   * @param {Function} onplay 재생 시 호출할 콜백.
   * 실제로 믹싱 작업은 onplay 함수 내에서 수행한다.
   */
  function SoundMixed(name, soundsToMix, onplay) {

    this._sounds = soundsToMix;
    this._onplay = onplay;
    this._gainNode = audioContext.createGain();

    // Properties
    //===========
    this.defineProp('name', {
      value: name
    });

    this.defineProp('volume', {
      value: 1,
      get: function (currentValue) {
        if (this.get('muted')) {
          return 0;
        }
        return currentValue;
      }
    });

    this.defineProp('muted', {
      value: false
    });

    // Connect Gain Node
    this._connectGainNode();
  }
  var smproto = SoundMixed.prototype;

  makePropertiable(smproto);

  util.extend(smproto, {

    // 마스터 노드에 연결되어 있는 사운드 객체의 게인 노드를,
    // 믹스 객체로 연결한다.
    // 믹스 객체의 사운드를 전체적으로 컨트롤하기 위함이다.
    _connectGainNode: function () {
      var self = this;
      this._sounds.forEach(function (obj) {
        var gain = obj.getGain();

        // 마스터 노드와의 연결을 끊는다.
        gain.disconnect();

        // 믹스 객체의 게인 노드와 연결한다.
        gain.connect(self._gainNode);
      });
    },

    /**
     * 사운드를 재생한다.
     * 
     * NOTE: Sound와 SoundMixed의 지연시간 처리 방법에는 차이가 있다.
     * Sound는 Web Audio API에서 제공하는 delay로 지연시간을 처리하고,
     * SoundMixed는 setTimeout으로 처리한다.
     *
     * NOTE: 믹스한 사운드에서는 중첩 재생(nestedPlay) 옵션을 제공하지 않는다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {SoundMixed} 
     */
    play: function (delay) {
      delay = delay || 0;

      // 볼륨은 호출 시점의 볼륨으로 적용한다.
      var volume = this.get('volume');

      setTimeout(function () {
        this._gainNode.gain.value = volume;
        this._onplay.apply(this, this._sounds);
      }.bind(this), delay * 1000);

      return this;
    },

    /**
     * 사운드를 정지한다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {SoundMixed}
     */
    stop: function (delay) {
      this._eachSoundsAfter('stop', delay);
      return this;
    },

    _eachSoundsAfter: function (methodName, delay/*, args, ... */) {
      var args = Array.prototype.slice.call(arguments, 1);

      delay = delay || 0;

      setTimeout(function () {
        this._sounds.forEach(function (obj) {
          obj[methodName]();
        });
      }.bind(this), delay * 1000);
    },

    /**
     * 사운드를 일시정지한다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {SoundMixed}
     */
    pause: function (delay) {
      this._eachSoundsAfter('pause', delay);
      return this;
    },

    /**
     * 사운드를 음소거한다.
     *
     * @return {SoundMixed}
     */
    mute: function () {
      this.set('muted', true);
      return this;
    },

    /**
     * 사운드의 음소거를 취소한다.
     *
     * @return {SoundMixed}
     */
    unmute: function () {
      this.set('muted', false);
      return this;
    },

    /**
     * 사운드의 볼륨을 설정하거나 가져온다.
     *
     * NOTE: 재생 시 지연시간이 적용되어 있어도, 호출 시점의 볼륨을 적용한다.
     *
     * @param {Numbe} [value] 볼륨값
     * @return {Number|SoundMixed}
     */
    volume: function (value) {
      if (isNaN(value)) {
        return this.get('volume');
      }
      this.set('volume', value);
      return this;
    },

    /**
     * 믹스한 사운드 객체의 복사본을 만든다.
     * 믹싱의 재료 사운드들의 복사본을 만들어 새로 할당하는 방식으로 처리한다.
     * Sound#clone()과 마찬가지로, 복사한 객체는 이름에 '-clone-' 문자열을 갖는다.
     * 믹스한 사운드를 재료로 다른 사운드를 믹스할 때에 사용된다.
     * 
     * @return {SoundMixed}
     */
    clone: function () {
      var name = this.get('name') + '-clone-' + util.uniqueId();
      var sounds = this._sounds.map(function (obj) {
        return obj.clone();
      });
      return new SoundMixed(name, sounds, this._onplay);
    },

    /**
     * 현재 사운드 객체의 게인(볼륨)노드를 가져온다.
     * 사운드를 믹스할 때, 볼륨 노드를 연결하기 위한 목적으로 사용된다.
     *
     * @return {GainNode}
     */
    getGain: function () {
      return this._gainNode;
    }

  });

  return SoundMixed;

});