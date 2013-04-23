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