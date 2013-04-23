module('재생2', {
  setup: function () {
    wave.reset();

    wave.create('yes1', {
      src: '../sounds/yes1'
    });
  }
});

asyncTest('일시정지하기', function () {
  var obj = wave('yes1');

  var retvalPause = false;
  var retvalEnd = false;

  obj.on('end', function () {
    retvalEnd = true;
  });
  obj.on('pause', function () {
    retvalPause = true;
  });

  obj.play();
  obj.pause(0.5);

  setTimeout(function () {
    equal(retvalPause, true, '재생 정지된다.');
    equal(retvalEnd, false, 'end 이벤트는 발생하지 않는다.');

    obj.play(); // 다시 재생한다.
  }, 1000);

  setTimeout(function () {
    equal(retvalEnd, true, '일시정지 후 다시 재생 후 종료되었기 때문에 end 이벤트가 발생한다.');
    start();
  }, 2000);
});

asyncTest('볼륨 조절하기', function () {
  var obj = wave('yes1');
  obj.set('volume', 0.2);

  obj.play();

  setTimeout(function () {
    equal(obj.get('volume'), 0.2, '볼륨이 줄어들었다.');
    start();
  }, 200);
});

test('메서드로 볼륨 조절하기', function () {
  var obj = wave('yes1');

  obj.volume(0.2);

  equal(obj.get('volume'), 0.2, '메서드로도 볼륨을 조절할 수 있다.');
  equal(obj.volume(), 0.2, '파라미터 없이 호출하면 현재 볼륨값을 리턴한다.');
});

test('랜덤 볼륨 적용하기', function () {
  var obj = wave('yes1');
  obj.set('volume', 1);
  obj.set('volumeVariation', true);

  var volumeA = obj.get('volume');
  var volumeB = obj.get('volume');

  ok(volumeA !== volumeB, '랜덤 볼륨 옵션을 적용하면, 매번 볼륨값을 다르게 가져온다.');
});

test('범위를 제한해서 랜덤 볼륨 적용하기', function () {
  var obj = wave('yes1');
  obj.set('volume', 0.8);
  obj.set('volumeVariation', [-0.2, 0.3]);

  var min = 0.8 * (1-0.2);
  var max = 0.8 * (1+0.3);
  for (var i = 0; i < 10; i++) {
    var volume = obj.get('volume');
    ok(volume >= min && volume <= max, '랜덤으로 가져오는 볼륨의 값은 전달한 파라미터의 비율과 동일하다.');
  }
});

asyncTest('피치 적용하기', function () {
  var obj = wave('yes1'); // 기본 재생시간 0.8초
  var retval = false;
  obj.set('pitch', 0.5);
  obj.on('end', function () {
    retval = true;
  });
  obj.play();

  setTimeout(function () {
    equal(retval, false, '피치는 재생 속도를 이용하고, 재생시간이 2배가 되었기 때문에, end 이벤트가 발생하지 않는다.');
  }, 1000);

  setTimeout(function () {
    equal(retval, true, '재생이 모두 완료되면 end 이벤트가 발생한다.');
    start();
  }, 2000);
});

test('랜덤 피치 적용하기', function () {
  var obj = wave('yes1');
  obj.set('pitchVariation', true);

  var a = obj.get('pitch');
  var b = obj.get('pitch');

  obj.play();

  ok(a !== b, '가져온 피치의 값이 다르다.');
});

asyncTest('중첩 재생하기', function () {
  var obj = wave('yes1');
  var retval = 0;

  obj.set('nestedPlay', true);
  obj.on('end', function () {
    retval++;
  });

  obj.play();
  obj.play(0.5);
  obj.play(1);

  setTimeout(function () {
    equal(retval, 3,
      '중첩 재생 옵션을 설정하면, 연달아 재생해도 이전 재생 내용이 끊기지 않는다.' +
      'end 이벤트도 재생한 만큼 모두 발생한다.');
    start();
  }, 2000);
});

asyncTest('중첩 재생 중 정지하기', function () {
  var obj = wave('yes1');
  var retval = 0;

  obj.set('nestedPlay', true);
  obj.on('end', function () {
    retval++;
  });

  obj.play();
  obj.play(0.1);
  obj.play(0.2);
  obj.stop(0.3);

  setTimeout(function () {
    equal(retval, 0, '중첩 재생 중 정지하면 마지막 사운드만 정지되며, 이후의 모든 이벤트가 발생하지 않는다.');
    start();
  }, 1000);

});

test('음소거 적용하기', function () {
  var obj = wave('yes1');

  equal(obj.get('volume'), 1, '현재 볼륨은 1이다.');

  obj.set('muted', true);

  equal(obj.get('volume'), 0, 'muted 속성이 설정된 경우, 볼륨값은 0이다.');

});

test('메서드 호출로 음소거하기', function () {
  var obj = wave('yes1');

  obj.set('volume', 0.5); // 먼저 0.5로 볼륨을 설정한다.
  equal(obj.get('volume'), 0.5, '음소거 전 볼륨은 0.5이다.');

  obj.mute();
  equal(obj.get('volume'), 0, '음소거 후 볼륨은 0이다.');

  obj.unmute();
  equal(obj.get('volume'), 0.5, '음소거를 취소하면 다시 이전 볼륨으로 설정된다.');
});