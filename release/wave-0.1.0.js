/*!
 * wave v0.1.0 - Web Audio Library For JavaScript Games.
 * https://github.com/ohgyun/wave
 *
 * (c) 2013, Ohgyun Ahn
 * MIT License
 */
;(function () {

/**
 * 모듈을 정의한다.
 * 라이브러리 내에서 의존성을 명확하게 구분하기 위해, AMD 스타일의 require/define을 사용한다.
 * 기본적인 사용법은 AMD에서 정의한 것과 동일하지만,
 * 라이브러리 내에서만 사용하는 용도이기 때문에, 간단함을 위해 다음과 같은 제한 사항이 있다.
 *   - 필요하신 시점에 모듈을 생성하지 않는다. define() 호출과 동시에 생성한다.
 *   - deps 모듈은 이미 모두 정의되어 있다고 가정한다. 즉, deps 목록에 있는 모듈을 먼저 define() 해야 한다.
 *   - 파라미터는 name, deps, callback 모두를 받는다. 오버로딩은 지원하지 않는다.
 *
 * 예를 들어, 아래와 같이 정의할 수 있다.
 *    define('example',
 *        [ 'dep1', 'dep2' ], // dep1과 dep2는 미리 정의되어 있어야 한다.
 *        function (dep1, dep2) {
 *          // 두 객체를 파라미터로 받는다.
 *        });
 */
function define(name, deps, callback) {
  var depObjs = deps.map(function (depName) {
    return require(depName);
  });
  require._registry[name] = callback.apply(null, depObjs);
}

/**
 * 모듈을 가져온다.
 * define()과 마찬가지로 간단함을 위해 아래 방법으로만 사용한다.
 *   - require(모듈명) 으로만 사용한다.
 *   - 여러 개의 파라미터를 지원하거나, 콜백을 지원하지 않는다.
 *
 * 예를 들어, 아래와 같이 사용할 수 있다.
 *   var obj = require('example'); // 미리 정의한 example 모듈을 가져온다.
 */
function require(name) {
  var obj = require._registry[name];
  if (typeof obj === 'undefined') {
    throw new Error('Module "' + name + '" is not defined.');
  }
  return obj;
}
require._registry = {
  /* moduleName: obj */
};

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


define('makePropertiable', [], function () {

  function makePropertiable(obj) {

    var getProps = function () {
        this.__props = this.__props || {};
        return this.__props;
      },
      emptyGet = function (currentValue) {
        return currentValue;
      },
      emptySet = function (newValue) {
        return newValue;
      },
      emptyOnset = function (newValue) {
        // do nothing
      },
      emptyValidate = function (newValue) {
        return true;
      },
      validateKeyExistence = function (key) {
        var props = getProps.call(this);
        if ( ! (key in props)) {
          throw new Error('Property "' + key + '" does not exist.');
        }
      };

    obj.defineProp = function (key, attr) {
      var prop = {
        value: attr.value,
        get: attr.get || emptyGet,
        set: attr.set || emptySet,
        validate: attr.validate || emptyValidate,
        onset: attr.onset || emptyOnset
      };

      getProps.call(this)[key] = prop;
    };

    obj.set = function (key, value) {
      validateKeyExistence.call(this, key);

      var prop = getProps.call(this)[key];

      if (prop.validate()) {
        prop.value = prop.set.call(this, value);
        prop.onset.call(this, prop.value);

      } else {
        throw new Error('The value "' + value + '" of "' + key + '" is invalid.');
      }

      return this;
    };

    obj.get = function (key) {
      validateKeyExistence.call(this, key);

      var prop = getProps.call(this)[key];

      return prop.get.call(this, prop.value);
    };

  }

  return makePropertiable;

});

define('makeEventable', [], function () {

  function makeEventable(obj) {

    var getEventMap = function () {
        this.__eventMap = this.__eventMap || {};
        return this.__eventMap;
      },

      validateEventExistence = function (name) {
        var eventMap = getEventMap.call(this);
        if (typeof eventMap[name] === 'undefined') {
          throw new Error('The event "' + name + '" is not defined.');
        }
      },

      shallowcopy = function (dest, source) {
        if ( ! source) { return dest; }

        for (var i in source) {
          if (source.hasOwnProperty(i)) {
            dest[i] = source[i];
          }
        }

        return dest;
      },

      register = function (name, handler, opts) {
        validateEventExistence.call(this, name);

        if (typeof handler !== 'function') {
          throw new Error('The handler of "' + name + '" should be a function.');
        }

        var eventMap = getEventMap.call(this);

        var info = shallowcopy({
          func: handler
        }, opts);

        eventMap[name].push(info);
      };

    obj.defineEvent = function (name) {
      var eventMap = getEventMap.call(this);
      eventMap[name] = [];
      return this;
    };

    obj.on = function (name, handler, opts) {
      register.call(this, name, handler);
      return this;
    };

    obj.once = function (name, handler) {
      register.call(this, name, handler, {
        once: true
      });
      return this;
    };

    obj.trigger = function (name/*, args ... */) {
      validateEventExistence.call(this, name);

      var eventMap = getEventMap.call(this);

      var handlerInfos = eventMap[name].slice(), // use copied
        args = Array.prototype.slice.call(arguments, 1),
        i = 0,
        len = handlerInfos.length,
        info;

      for (; i < len; i++) {
        info = handlerInfos[i];
        info.func.apply(this, args);

        if (info.once === true) {
          // splice from original array
          eventMap[name].splice(i, 1);
        }
      }

      return this;
    };

  }

  return makeEventable;

});

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

define('soundLoader', [
  'audioContext'
], function (audioContext) {

  return {

    // 생성한 버퍼를 담아둘 캐시
    _bufferCached: {},

    // 현재 브라우저에서 재생 가능한 오디오 확장자를 배열에 담아둔다.
    extensions: (function () {
      var tmpAudio = new Audio();

      return [

        { codecs: [ 'audio/mpeg;' ], ext: '.mp3' },
        { codecs: [ 'audio/wav; codecs="1"' ], ext: '.wav' },
        { codecs: [ 'audio/ogg; codecs="vorbis"' ], ext: '.ogg' },
        { codecs: [ 'audio/webm; codesc="vorbis"' ], ext: '.webm' },
        { codecs: [ 'audio/x-m4a;', 'audio/acc;' ], ext: '.m4a' }

      ].map(function (type) {
        // 재생 가능한 경우 확장자만 뽑아 배열로 만든다.
        var canPlay = type.codecs.some(function (codec) {
          return !!tmpAudio.canPlayType(codec).replace(/^no$/, '');
        });

        if (canPlay) {
          return type.ext;
        }

        return null;

      }).filter(function (ext) {
        return ext; // null인 것은 제외한다.
      });

    }()),

    // 오디오 파일을 로드한다.
    // @param {string} src 확장자가 붙지 않은 음원 주소
    // @param {function} callback 로드 성공 시 콜백
    // @param {object} context 로드 콜백의 컨텍스트
    load: function (src, callback, context) {
      var extensions = this.extensions,
        self = this,
        cursor = 0;

      // 이미 캐시되어 있는 경우, 캐시된 데이터를 리턴한다.
      if (this._bufferCached[src]) {
        callback.call(context, this._bufferCached[src]);
        return;
      }

      // 브라우저에서 지원하는 확장자를 붙여가며 다운로드를 시도한다.
      (function tryToLoad() {
        var url = src + extensions[cursor],
          onfail = function () {
            // 로드에 실패하면 다음 확장자로 다시 시도한다.
            cursor++;

            // 모든 확장자에서 실패하면 에러를 던진다.
            if (cursor === extensions.length) {
              throw new Error('Cannot load "' + src + '" file.');
            }

            tryToLoad();
          };

        self._tryToLoad(url, onfail, callback, context);
      }());
    },

    _tryToLoad: function (url, failCallback, loadCallback, loadContext) {
      var self = this;

      this._requestAsyc({
        url: url,
        success: function (res) {
          self._decodeAudioData(url, res, loadCallback, loadContext);
        },
        fail: function () {
          failCallback();
        }
      });
    },

    _requestAsyc: function (opts) {
      var xhr = new XMLHttpRequest();

      xhr.open('GET', opts.url, true);

      // 오디오 파일은 텍스트가 아닌 바이너리이므로, 'arraybuffer' 타입으로 다운로드 받는다.
      xhr.responseType = 'arraybuffer';

      xhr.onload = function () {
        var status = this.status;

        if (status >= 200 && status < 300 || status === 304) {
          opts.success(this.response);
        } else {
          opts.fail();
        }
      };

      xhr.onerror = function () {
        opts.fail();
      };

      xhr.send();
    },

    _decodeAudioData: function (url, res, callback, context) {
      var self = this,
        src = url.substring(0, url.lastIndexOf('.'));

      // decodeAudioData() 는 메인 자바스크립트 스레드에 영향을 주지 않고, 비동기로 디코딩한다.
      audioContext.decodeAudioData(res, function (buffer) {
        self._bufferCached[src] = buffer;
        callback.call(context, buffer);
      });
    }
  };

});

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

define('Timer', [
  'util'
], function (util) {

  function Timer() {
    this._timers = [
      /* { 실행시간(mills} : 타이머의 키값 } */
    ];
  }

  util.extend(Timer.prototype, {

    now: function () {
      return new Date().getTime();
    },

    // 타이머를 생성한다.
    create: function (callback, secAfter) {
      var delayMills = secAfter * 1000,
        callTimeMills = this.now() + delayMills,
        obj = {},
        timerKey = setTimeout(function () {
          callback();

          // 콜백을 실행하고, 타이머 배열에서 현재 객체를 제거한다.
          var idx = this._timers.indexOf(obj);
          this._timers.splice(idx, 1);
        }.bind(this), delayMills);

      obj.callTimeMills = callTimeMills;
      obj.timerKey = timerKey;

      this._timers.push(obj);
    },

    // 특정 시간 이후의 타이머를 삭제한다.
    removeAfter: function (secAfter) {
      var afterMills = this.now() + (secAfter * 1000);

      this._timers = this._timers.filter(function (obj) {
        if (afterMills < obj.callTimeMills) {
          clearTimeout(obj.timerKey);
          return false;
        }
        return true;
      });
    }

  });

  return Timer;

});

define('BufferSource', [
  'audioContext',
  'soundLoader',
  'Timer',
  'util'
], function (audioContext, soundLoader, Timer, util) {

  function BufferSource(gainNode) {
    // 음원읜 버퍼를 담아둘 배열
    this._buffers = [];

    // 현재 재생을 위한 버퍼
    this._currBuffer = null;

    // 현재 재생할 버퍼 소스 객체
    this._bufferSource = null;

    // 볼륨 처리를 위한 게인 노드
    this._gainNode = gainNode;

    // 타이머
    this._timer = new Timer();

    // 재생 시작한 시간
    this._startTime = 0;

    // 일시 정지한 시간
    this._pausedTime = 0;
  }

  var bsproto = BufferSource.prototype;

  util.extend(bsproto, {

    load: function (srcs, callback) {
      // 새로 로드하기 전에 기존의 버퍼를 지운다.
      this._buffers.length = 0;

      var self = this,
        len = srcs.length;

      srcs.forEach(function (src) {
        soundLoader.load(src, function (buffer) {
          self._buffers.push(buffer);

          if (self._buffers.length === len) {
            callback();
          }
        });
      });
    },

    /**
     * @param {number} opts.delay 지연시간(초)
     * @param {function} opts.onplay 재생 이벤트
     * @param {function} opts.onend 종료 이벤트
     */
    play: function (opts) {
      this._refreshBufferSource();

      // 피치 설정
      this._setPitch(opts.pitch);

      var when = audioContext.getTimeAfter(opts.delay),
        duration = this._getDuration(),
        startTime = opts.delay || 0,
        endTime = startTime + duration,
        pos = this._pausedTime - this._startedTime;

      // 일시 정지했던 경우, 이전 위치에서부터 다시 재생한다.
      this._bufferSource.start(when, pos);

      if (typeof opts.onplay === 'function') {
        this._timer.create(opts.onplay, startTime);
      }
      if (typeof opts.onend === 'function') {
        this._timer.create(opts.onend, endTime);
      }

      // 재생 시작시간과 일시 정지 시간을 초기화한다.
      this._startedTime = when;
      this._pausedTime = 0;
    },

    _refreshBufferSource: function () {
      var source = audioContext.createBufferSource(this._gainNode);

      // 일시 정지된 상태가 아니라면 버퍼를 랜덤하게 골라온다.
      if (this._isNotPaused()) {
        this._currBuffer = this._pickBufferRandomly();
      }

      source.buffer = this._currBuffer;

      this._bufferSource = source;
    },

    // 일시 정지된 상태인가?
    _isNotPaused: function () {
      return this._pausedTime === 0;
    },

    _pickBufferRandomly: function () {
      var len = this._buffers.length;
      if (len > 0) {
        return this._buffers[ util.rand(0, len-1) ];
      }
      return null;
    },

    stop: function (delay, onstop) {
      var stopTime = delay || 0;

      // 버퍼 소스가 없으면 한 번도 재생되지 않았던 것이다.
      if ( ! this._bufferSource) { return; }

      var when = audioContext.getTimeAfter(delay);
      this._bufferSource.stop(when);
      this._bufferSource = null;

      // 정지 시점 이후의 타이머는 모두 삭제한다.
      this._timer.removeAfter(stopTime);

      if (typeof onstop === 'function') {
        this._timer.create(onstop, delay);
      }
    },

    pause: function (delay, onpause) {
      this.stop(delay, onpause);
      this._pausedTime = audioContext.getTimeAfter(delay);
    },

    _setPitch: function (value) {
      // Web Audio API에서 피치는 재생비율을 변경하는 방식으로 설정한다.
      this._bufferSource.playbackRate.value = value;
    },

    _getDuration: function () {
      // 재생시간은 재생 속도의 영향을 받는다.
      // 피치를 재생 속도를 변경하는 방식으로 처리하기 때문에, 피치를 변경하면 재생시간도 변경된다.
      var playbackRate = this._bufferSource.playbackRate.value;
      return this._currBuffer.duration / playbackRate;
    }

  });

  return BufferSource;

});

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

}());