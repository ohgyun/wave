define('wave', [
  'master',
  'Sound',
  'SoundMixed'
], function (master, Sound, SoundMixed) {

  var soundRepos = {};

  /**
   * 사운드 객체를 가져온다.
   * 해당 이름의 객체가 존재하지 않으면 오류를 발생한다.
   *
   * @param {String} name 사운드 객체의 이름
   * @return {Sound}
   */
  var wave = function (name) {
    var obj = soundRepos[name];
    if ( ! obj) {
      throw new Error('The "' + name + '" object does not exist.');
    }
    return obj;
  };

  /**
   * 사운드 객체를 생성한다.
   * 파라미터로 전달하는 이름으로 객체를 생성하며,
   * 같은 이름의 객체가 이미 존재한다면 오류를 발생한다.
   *
   * NOTE: 옵션으로 넘기는 값은 객체 생성 후 해당 옵션으로 set()을 호출하는 것과 동일하다.
   *
   * @param {String} name 사운드 객체의 이름
   * @param {Object} [opts] 생성자 옵션으로 객체를 최초 생성할 때에 넘긴다.
   * 이미 생성되어 있는 객체를 가져오는 경우라면, 이 값은 무시한다.
   * @return {Sound}
   */
  wave.create = function (name, opts) {
    if (soundRepos[name]) {
      throw new Error('"' + name + '" object already exists.');
    }

    var sound = new Sound(name, opts);
    soundRepos[name] = sound;

    return sound;
  };

  /**
   * 전체 볼륨을 조절하거나 가져온다.
   * 볼륨값을 파라미터로 전달할 경우, 값을 설정하고 wave 객체를 리턴한다.
   * 파라미터 없이 호출하는 경우, 설정되어 있는 전체 볼륨값을 리턴한다. 
   *
   * @param {Number} [value] 볼륨값
   * @return {Number|wave}
   */
  wave.volume = function (value) {
    if (isNaN(value)) {
      return master.get('volume');
    }
    master.set('volume', value);
    return this;
  };

  /**
   * 전체 음원을 소거한다.
   *
   * @return {wave}
   */
  wave.mute = function () {
    master.set('muted', true);
    return this;
  };

  /**
   * 전체 음소거를 취소한다.
   *
   * @return {wave}
   */
  wave.unmute = function () {
    master.set('muted', false);
    return this;
  };

  /**
   * 생성한 객체 정보와 전체 볼륨을 초기화한다.
   * wave 객체를 생성하면 해당 객체를 맵에 저장하는데,
   * reset()으로 이 맵을 비울 수 있다.
   * 주로 테스트 용도로 사용한다.
   *
   * @return {wave}
   */
  wave.reset = function () {
    soundRepos = {};
    this.unmute();
    this.volume(1);
    return this;
  };

  /**
   * 여러 사운드 객체를 믹싱해 새 사운드 객체를 생성한다.
   * 재료가 되는 사운드 객체의 이름을 배열로 넘기고,
   * 해당 객체의 복사본을 파라미터로 받아 play() 함수를 구현하는 방식이다.
   * 
   * NOTE: 믹싱의 재료가 되는 사운드 객체는 믹싱하기 전에 생성되어 있어야 한다.
   * 생성되어 있지 않다면, 해당 객체가 존재하지 않는다는 오류를 발생한다.
   *
   * NOTE: onplay()의 파라미터로는 soundsNameToMix로 넘긴 사운드 객체의 복사본을 받는다.
   * '복사본'은 Sound#clone()을 호출할 것과 같으며, 해당 객체의 src 속성만 가져온 객체이다.
   * 복사본 객체의 이름에는 '-clone-' 문자열이 포함되어 있다.
   * soundsNameToMix에 같은 이름을 중복해서 포함한다면, 해당 객체의 복사복이 각각 생성된다.
   * 한 개의 음원을 다양하게 활용하고자 하는 경우에 적용할 수 있다.
   *
   * NOTE: 믹싱의 재료로 이미 믹스한 객체(SoundMixed)를 사용할 수도 있다.
   *
   * NOTE: 일반 사운드 객체와 믹스한 사운드 객체는 서로 다른 클래스를 갖는다.
   * 해당 클래스는 Sound와 SoundMixed로 분리되어 있지만, 동일한 인터페이스를 갖는다.
   * 현재는 의도적으로 일반 사운드와 믹스한 사운드를 구분하기 위해 나눠두었지만,
   * 필요하다면 추후 버전에서 인터페이스로 추상화할 수 있다.
   *
   * @param {String} name 믹싱해서 생성할 사운드 객체의 이름
   * @param {Array<String>} soundsNameToMix 믹싱의 재료가 되는 사운드 객체의 이름
   * @param {Function} onplay 믹싱 객체의 play()를 호출할 때에 실행할 함수.
   * soundsNameToMix에 배열로 넘긴 순서대로, 해당 재료 객체의 복사본을 파라미터로 받는다.
   * @return {SoundMixed}
   */
  wave.mix = function (name, soundsNameToMix, onplay) {
    var soundsToMix = soundsNameToMix.map(function (soundName) {
      return wave(soundName).clone();
    });

    var mixed = new SoundMixed(name, soundsToMix, onplay);
    soundRepos[name] = mixed;

    return mixed;
  };

  return wave;

});

window.wave = require('wave');