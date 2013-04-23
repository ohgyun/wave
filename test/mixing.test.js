module('믹싱', {
  setup: function () {
    wave.reset();

    wave.create('bark', {
      src: '../sounds/bark'
    });
  }
});

test('여러 개의 음원을 섞어서 재생할 수 있다.', function () {
  var bbbark = wave.mix('bbbark', [
    'bark', 'bark', 'bark'
  ], function (bark1, bark2, bark3) {
    bark1.play();
    bark2.play(0.1);
    bark3.play(0.2);
  });

  bbbark.play();

  ok(true, '이 테스트는 직접 소리를 듣는 방식으로 확인한다.');
});


module('믹스된 사운드의 속성 설정하기', {
  setup: function () {
    wave.reset();

    wave.create('bark', {
      src: '../sounds/bark'
    });

    wave.mix('bbbark', [
      'bark', 'bark', 'bark'
    ], function (b1, b2, b3) {
      b1.play();
      b2.play(0.1);
      b3.play(0.2);
    });
  }

});

test('볼륨 설정하기', function () {
  var obj = wave('bbbark').volume(0.5);
  obj.play();
  equal(obj.volume(), 0.5, '새로 설정된 볼륨은 0.5이다.');
});

test('음 소거하기', function () {
  var obj = wave('bbbark');
  obj.mute();
  obj.play();
  equal(obj.volume(), 0, '음소거된 경우 볼륨값은 0이다.');

  obj.unmute();
  obj.play(0.5);
  equal(obj.volume(), 1, '취소하면 다시 1이 된다.');
});

test('재생 후 정지하기', function () {
  var obj = wave('bbbark');

  obj.play();
  obj.stop(0.2);
  obj.play(1);

  ok(true, '이 테스트는 직접 소리를 듣는 방식으로 확인한다.');
});

test('일시 정지 후 다시 재생하기', function () {
  wave.create('yes1', {
    src: '../sounds/yes1'
  });

  var obj = wave.mix('yesbark', [ 'yes1', 'bark' ], function (yes1, bark) {
    yes1.play();
    bark.play();
  });

  obj.play();
  obj.pause(0.5);

  setTimeout(function () {
    obj.play();
  }, 1000);

  ok(true, '이 테스트는 직접 소리를 듣는 방식으로 확인한다.');
});

test('믹싱한 사운드를 소스로 믹싱하기', function () {
  wave.create('yes1', {
    src: '../sounds/yes1'
  });
  wave.create('yes2', {
    src: '../sounds/yes2'
  });

  wave.mix('yesbark', ['yes1', 'bark'], function (yes1, bark) {
    yes1.play();
    bark.play(0.2);
  });

  wave.mix('nestedmix', ['yesbark', 'yes2'], function (yesbark, yes2) {
    yesbark.play();
    yes2.play(0.3);
  });

  wave('nestedmix').play();

  ok(true, '이 테스트는 직접 소리를 듣는 방식으로 확인한다.');
});

test('총소리 믹싱 테스트', function () {
  wave.create('shot', {
    src: '../sounds/shot'
  });

  wave.mix('short-burst', [ 'shot' ], function (shot) {
    shot.set('volume', 0.2);
    shot.set('volumeVariation', [-0.1, 0.1]);
    shot.set('pitch', 0.4);
    shot.set('nestedPlay', true);

    for (var i = 0; i < 0.3; i += 0.1) {
      shot.play(i);
    }
  });

  wave.mix('long-burst', [ 'shot' ], function (shot) {
    shot.set('volume', 0.1);
    shot.set('volumeVariation', [-0.1, 0.1]);
    shot.set('pitch', 0.5);
    shot.set('nestedPlay', true);

    for (var i = 0; i < 0.7; i += 0.07) {
      shot.play(i);
    }
  });

  wave.mix('war-bg', ['short-burst', 'long-burst'], function (shortBurst, longBurst) {
    shortBurst.volume(0.1);
    shortBurst.play();

    shortBurst.volume(0.3);
    shortBurst.play(0.5);

    shortBurst.volume(0.2);
    shortBurst.play(1);

    longBurst.volume(0.2);
    longBurst.play(0.2);

    longBurst.volume(0.3);
    longBurst.play(2);
  });

  wave('war-bg').play();

  ok(true, '이 테스트는 직접 들으며 확인한다.');
});