module('사운드 로드', {
  setup: function () {
    wave.reset();
  }
});

asyncTest('사운드 로드하기', function () {
  var obj = wave.create('bark');

  equal(obj.get('loadState'), 0, '아직 로드되지 않았다.');

  obj.set('src', '../sounds/bark');

  equal(obj.get('loadState'), 1, 'src를 설정하면 바로 로드를 시작한다.');

  setTimeout(function () {
    equal(obj.get('loadState'), 2, '사운드가 로드되었다');
    start();
  }, 300);
});

asyncTest('사운드 로드 콜백 할당하기', function () {
  var obj = wave.create('bark');
  var retval = false;
  obj.on('load', function () {
    retval = true;
  });
  obj.set('src', '../sounds/bark');

  setTimeout(function () {
    equal(retval, true, '사운드 로드가 완료되면 load 콜백을 실행한다.');
    start();
  }, 200);
});

asyncTest('한 사운드를 동시에 여러 번 로드하기', function () {
  var obj = wave.create('bark');
  var retval = 0;
  obj.on('load', function () {
    retval++;
  });
  obj.set('src', '../sounds/bark');
  obj.set('src', '../sounds/bark');
  obj.set('src', '../sounds/bark');

  setTimeout(function () {
    equal(retval, 1, '여러 번 호출해도 한 번만 로드하며, 로드 이벤트도 한 번만 발생한다.');
    start();
  }, 200);
});

asyncTest('사운드를 로드해서 재생하기', function () {
  var obj = wave.create('bark', {
    src: '../sounds/bark'
  });
  var retval = false;

  obj.on('play', function () {
    retval = true;
  });

  obj.play();

  setTimeout(function () {
    equal(retval, true, '재생하면 play 이벤트가 발생한다.');
    start();
  }, 200);
});

asyncTest('사운드가 로드되기 전에 재생하기', function () {
  var obj = wave.create('bark');
  var retval = false;

  obj.on('play', function () {
    retval = true;
  });
  obj.play();

  obj.set('src', '../sounds/bark');

  setTimeout(function () {
    equal(retval, true, '로드된 후에 재생된다.');
    start();
  }, 200);

});

asyncTest('한 번 로드한 파일을 다시 로드하기', function () {
  var obj = wave.create('bark', {
    src: '../sounds/bark'
  });

  setTimeout(function () {
    // 로드가 완료된 후...
    var objB = wave.create('bark2', {
      src: '../sounds/bark'
    });
    equal(objB._bufferSource._buffers[0], obj._bufferSource._buffers[0],
        '로드된 버퍼와 캐시된 버퍼가 동일하다.');
    start();
  }, 1000);

});