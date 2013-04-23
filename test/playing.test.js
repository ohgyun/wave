module('재생', {
  setup: function () {
    wave.reset();

    wave.create('yes1', {
      src: '../sounds/yes1'
    });
  }
});

asyncTest('자동 재생 옵션 설정하기', function () {
  var obj = wave('yes1');

  obj.set('autoplay', true);

  var retval = false;

  obj.on('play', function () {
    retval = true;
  });

  obj.set('src', '../sounds/bark');

  setTimeout(function () {
    equal(retval, true, '자동 재생 옵션이 설정된 경우, 로드 후 바로 재생한다.');
    start();
  }, 200);

});

asyncTest('재생할 때 지연 시간 적용하기', function () {
  var obj = wave('yes1');
  var retval = false;

  obj.on('play', function () {
    retval = true;
  });
  obj.play(0.5);

  setTimeout(function () {
    equal(retval, false, '아직 재생되지 않았다.');
  }, 200);

  setTimeout(function () {
    equal(retval, true, '0.5초 후에 재생된다.');
    start();
  }, 700);
});

asyncTest('재생 완료 이벤트 할당하기', function () {
  var obj = wave('yes1');
  var retval = false;

  obj.on('end', function () {
    retval = true;
  });

  obj.play();

  setTimeout(function () {
    equal(retval, true, '재생 종료 후 이벤트가 발생한다.');
    start();
  }, 1000);
});

asyncTest('재생 정지하기', function () {
  var obj = wave('yes1');
  var retvalEnd = false;
  var retvalStop = false;

  obj.on('end', function () {
    retvalEnd = true;
  });
  obj.on('stop', function () {
    retvalStop = true;
  });

  obj.play();
  obj.stop(0.5); // 0.5초 후에 종료

  setTimeout(function () {
    equal(retvalEnd, false, '재생을 정지한 경우 완료 이벤트가 발생하지 않는다.');
    equal(retvalStop, true, '대신 정시 이벤트가 발생한다.');
    start();
  }, 1000);
});

asyncTest('연속해서 재생하기', function () {
  var obj = wave('yes1');
  var retval = 0;

  obj.on('end', function () {
    retval++;
  });

  obj.play();
  obj.play(0.5);

  setTimeout(function () {
    equal(retval, 1, '연달아 재생하면 이전 재생은 중단된다.');
    start();
  }, 2000);
});

asyncTest('연속 재생 시 이벤트 발생하기', function () {
  var obj = wave('yes1'); // 재생시간 0.8

  var playCalled = 0;
  var endCalled = 0;

  obj.on('play', function () {
    playCalled++;
  });
  obj.on('end', function () {
    endCalled++;
  });

  obj.play();
  obj.play(1); // 1초 뒤에 재생, 즉 이전 플레이가 모두 종료된 후 재생

  setTimeout(function () {
    equal(playCalled, 2, '시간에 관계없이 2번 재생된다.');
    equal(endCalled, 2, 'play()가 호출되기 전에 이미 재생이 완료된 상태이므로 2번 호출되어야 한다.');
    start();
  }, 2000);
});

asyncTest('랜덤 재생하기', function () {
  var obj = wave.create('yes', {
    src: [
      '../sounds/yes1',
      '../sounds/yes2',
      '../sounds/yes3',
      '../sounds/yes4'
    ]
  });

  obj.play();
  obj.play(1);
  obj.play(2);
  obj.play(3);

  setTimeout(function () {
    ok(true, '서로 다른 음원이 재생된다. (직접 들어서 테스트해야 한다.)');
    start();
  }, 4000);
});