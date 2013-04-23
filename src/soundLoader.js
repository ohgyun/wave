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