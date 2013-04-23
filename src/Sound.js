define('Sound', [
  'audioContext',
  'BufferSource',
  'makePropertiable',
  'makeEventable',
  'util'
], function (audioContext, BufferSource, makePropertiable, makeEventable, util) {

  /*
   * 사운드 객체를 생성한다.
   *
   * NOTE: 사운드 객체는 Sound() 생성자를 직접 호출하지 않고, Wave() 팩토리 메서드로 생성한다.
   * Wave 객체가 생성한 사운드 객체를 관리하기 때문이다.
   * Sound 생성자는 라이브러리 사용자에게 노출되지 않는다.
   *
   * @private
   * @param {String} name 사운드 객체의 이름
   * @param {Object} [opts] 옵션
   */
  function Sound(name, opts) {
    var self = this;

    // 사운드 객체에서 사용할 게인 노드
    this._gainNode = audioContext.createGain();

    // 실제 음원 재생을 위한 버퍼 소스 래핑 객체
    this._bufferSource = new BufferSource(this._gainNode);

    // 프로퍼티 설정
    //-----------

    // 사운드 객체 이름
    this.defineProp('name', {
      value: name
    });

    // 사운드 파일 경로 (확장자를 포함하지 않는다)
    this.defineProp('src', {
      value: '',
      set: function (newValue) {
        // src 는 항상 배열 형태로 받는다.
        if (typeof newValue === 'string') {
          return [ newValue ];
        }
        return newValue;
      },
      onset: function (newValue) {
        this._load();
      }
    });

    // 로드 상태 
    this.defineProp('loadState', {
      value: Sound.STATE_NOT_LOADED
    });

    // 자동 재생 옵션
    this.defineProp('autoplay', {
      value: false
    });

    // 볼륨과 피치에서 사용하는 유틸리티 함수
    function getValueFromVariation(propName) {
      // variation의 비율을 적용한 범위 내에서 랜덤한 값을 가져온다.
      return function (currentValue) {
        var variation = this.get(propName),
          min = currentValue * (1 + variation[0]),
          max = currentValue * (1 + variation[1]);

        return util.randFloat(min, max);
      };
    }

    // 현재 값을 범위 형식으로 변환해 리턴한다.
    function getRangeValue(currentValue) {
      // 랜덤 볼륨 설정이 없는 경우, 적용하지 않음.
      if ( ! currentValue) {
        return [0, 0];
      }

      // true로 설정하는 경우 기본값인 +-0.3를 리턴.
      if (currentValue === true) {
        return [-0.3, 0.3];
      }

      return currentValue;
    }

    // 볼륨 속성
    this.defineProp('volume', {
      value: 1,
      get: function (currentValue) {
        if (this.get('muted')) {
          // muted 속성이 설정되어 있다면 0을 리턴한다.
          return 0;
        }
        return getValueFromVariation('volumeVariation').call(this, currentValue);
      }
    });

    // 랜덤 볼륨 속성
    this.defineProp('volumeVariation', {
      value: false,
      get: getRangeValue
    });

    // 피치 속성
    this.defineProp('pitch', {
      value: 1,
      set: function (newValue) {
        if (isNaN(newValue)) {
          return 1;
        }
        return newValue;
      },
      get: getValueFromVariation('pitchVariation')
    });

    // 랜덤 피치 속성
    this.defineProp('pitchVariation', {
      value: false,
      get: getRangeValue
    });

    // 중첩 재생 여부
    // true로 설정하면, 연달아 재생해도 이전 재생되던 음원을 끊지 않는다.
    this.defineProp('nestedPlay', {
      value: false
    });

    // 음소거 설정
    this.defineProp('muted', {
      value: false
    });

    // 이벤트 설정
    this.defineEvent('load');
    this.defineEvent('play');
    this.defineEvent('end');
    this.defineEvent('stop');
    this.defineEvent('pause');

    // 파라미터로 전달받은 옵션으로 기본 옵션을 덮어쓴다.
    util.extend(this.opts, opts, function (key, value, dest, source) {
      // 전달받은 옵션을 덮어쓰되, set()으로 덮어쓴다.
      self.set(key, value);
    });
  }

  Sound.STATE_NOT_LOADED = 0;
  Sound.STATE_LOADING = 1;
  Sound.STATE_LOADED = 2;

  var soundProto = Sound.prototype;

  makePropertiable(soundProto);
  makeEventable(soundProto);

  // 프로토타입을 정의한다.
  util.extend(soundProto, {

    // 사운드 버퍼를 로드한다.
    // 한 번 로드한 경우 다시 로드하지 않는다.
    _load: function () {
      var loadState = this.get('loadState');

      if (loadState === Sound.STATE_LOADED ||
          loadState === Sound.STATE_LOADING) {
        return;
      }

      this.set('loadState', Sound.STATE_LOADING);

      var srcs = this.get('src');
      if (srcs) {
        this._bufferSource.load(srcs, function () {
          this.set('loadState', Sound.STATE_LOADED);
          this.trigger('load');

          // 자동 재생 옵션이 설정되어 있으면, 바로 재생한다.
          if (this.get('autoplay')) {
            this.play();
          }
        }.bind(this));
      } else {
        // src 가 없다면 로드를 시도하지 않는다.
        // do nothing
      }
    },

    /**
     * 사운드를 재생한다.
     * 초 단위의 지연시간을 파라미터로 넘길 수 있다.
     *
     * NOTE: 사운드를 한 번 재생하고, 재생이 종료되기 전에 다시 play()를 호출하면 이전 재생은 중지된다.
     * 이전 재생을 유지하고 싶다면, 'nestedPlay' 옵션을 true로 설정하면 된다.
     *
     * NOTE: 재생이 호출된 시점에 사운드가 로드되어 있지 않다면, 로드가 완료된 후 재생한다.
     * 지연시간을 파라미터로 넘긴 경우라면, 로드가 완료된 시점을 기준으로 지연시간을 적용해 재생한다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {Sound}
     */
    play: function (delay) {
      if (this._isNotLoaded()) {
        this._runOnceOnLoad(function () {
          this.play(delay);
        }.bind(this));

        return this;
      }

      if ( ! this.get('nestedPlay')) {
        // 중첩 재생 모드가 아니라면, 새로 재생하기 전에 이전 재생하던 것을 중지한다.
        this._stop(delay);
      }
      this._play(delay);

      return this;
    },

    _isNotLoaded: function () {
      return this.get('loadState') !== Sound.STATE_LOADED;
    },

    _runOnceOnLoad: function (callback) {
      this.once('load', callback);
    },

    _play: function (delay) {
      // 재생하기 전에 볼륨을 설정한다.
      this._gainNode.gain.value = this.get('volume');

      // 버퍼 소스의 재생 메서드를 호출한다.
      this._bufferSource.play({
        delay: delay,
        pitch: this.get('pitch'),
        onplay: function () {
          this.trigger('play');
        }.bind(this),
        onend: function () {
          this.trigger('end');
        }.bind(this)
      });
    },

    /**
     * 사운드 재생을 중지한다.
     * play()와 마찬가지로 지연시간을 넘길 수 있으며, 초 단위로 동작한다.
     *
     * NOTE: 로딩이 완료되지 않은 상태에서 stop()을 호출하면,
     * 로딩이 완료된 시간을 기준으로 지연시간을 적용해 정지한다.
     *
     * NOTE: 'nestedPlay' 옵션이 설정되어 있고,
     * 연속해서 사운드를 재생한 후에 stop()을 호출한 경우라면, 마지막 사운드만 종료된다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {Sound}
     */
    stop: function (delay) {
      if (this._isNotLoaded()) {
        this._runOnceOnLoad(function () {
          this.stop(delay);
        }.bind(this));

        return this;
      }

      this._stop(delay);

      return this;
    },

    _stop: function (delay) {
      this._bufferSource.stop(delay, function () {
        this.trigger('stop');
      }.bind(this));
    },

    /**
     * 사운드를 일시정지한다.
     * 일시정지 후 다시 재생하면, 해당 위치부터 다시 재생한다.
     *
     * NOTE: 지연시간을 적용할 수 있으며, 로딩이 완료되지 않은 경우 로딩 완료 시점을 기준으로 동작한다.
     * 또한, nestedPlay 옵션이 설정되어 있는 경우, 마지막으로 재생되는 사운드만 일시정지한다.
     *
     * @param {Number} [delay] 지연시간(초)
     * @return {Sound}
     */
    pause: function (delay) {
      if (this._isNotLoaded()) {
        this._runOnceOnLoad(function () {
          this.pause(delay);
        }.bind(this));

        return this;
      }

      this._pause(delay);

      return this;
    },

    _pause: function (delay) {
      this._bufferSource.pause(delay, function () {
        this.trigger('pause');
      }.bind(this));
    },

    /**
     * 사운드의 볼륨을 설정하거나 현재 값을 가져온다.
     * 볼륨의 기본값은 1이며, 0과 1사이의 값으로 설정할 수 있다.
     * 파라미터로 볼륨값을 전달하는 경우 값을 설정하고,
     * 전달하지 않는다면 현재 설정된 값을 리턴한다.
     *
     * NOTE: 지연시간을 적용해 재생하는 경우, play() 메서드를 호출하는 시점의 볼륨을 적용한다.
     *
     * NOTE: 현재 볼륨값에 관계없이 음을 소거하는 경우 볼륨값은 0을 리턴한다.
     * 볼륨값은 저장되어 있으며, 음소거를 취소하면 이전의 볼륨으로 다시 복원한다.
     *
     * @param {Number} [value] 볼륨값
     * @return {Number|Sound}
     */
    volume: function (value) {
      if (isNaN(value)) {
        return this.get('volume');
      }
      this.set('volume', value);
      return this;
    },

    /**
     * 사운드 객체의 음을 소거한다.
     *
     * @return {Sound}
     */
    mute: function () {
      this.set('muted', true);
      return this;
    },

    /**
     * 사운듸 객체에 적용한 음소거를 취소한다.
     * 음소거를 취소하면 이전 볼륨으로 복원한다.
     *
     * @return {Sound}
     */
    unmute: function () {
      this.set('muted', false);
      return this;
    },

    /**
     * 사운드 객체의 게인노드(볼륨노드)를 가져온다.
     * 사운드를 믹싱할 때, 볼륨 노드를 연결하기 위한 목적으로 사용한다.
     * @return {GainNode}
     */
    getGain: function () {
      return this._gainNode;
    },

    /**
     * 현재 사운드 객체의 복사본을 만든다.
     * 복제 시에는 현재 사운드의 src 속성만 가져온다.
     * 복제한 사운드는 '사운드명-clone-고유번호'와 같은 형태의 이름을 갖는다.
     *
     * NOTE: 사운드를 믹싱할 때는 항상 사운드 객체의 복사본을 사용한다.
     * 믹싱할 때 원본 사운드 객체가 영향을 받아서는 안되기 때문이다.
     * 복사본 생성은 사운드 객체에서 담당하기 때문에, 복사본은 Wave 객체의 맵에 저장되지 않는다.
     *
     * @return {Sound}
     */
    clone: function () {
      var name = this.get('name') + '-clone-' + util.uniqueId();
      var cloned = new Sound(name, {
        src: this.get('src')
      });

      return cloned;
    }

  });

  return Sound;

});
