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