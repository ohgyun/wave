module('속성 설정', {
  setup: function () {
    wave.reset();
  }
});

test('사운드 객체 생성하기', function () {
  var obj = wave.create('bark');
  ok(obj, '사운드 객체를 생성한다');
});

test('같은 이름의 사운드 객체를 생성하기', function () {
  var obj = wave.create('bark');

  try {
    var obj2 = wave.create('bark');
    ok(false);
  } catch (e) {
    ok(true, '같은 이름의 객체를 생성하면 오류를 발생한다.');
  }
});

test('속성 설정하고 가져오기', function () {
  var obj = wave.create('bark');
  var src = '../sounds/bark';
  obj.set('src', src);
  equal(obj.get('src'), src, '설정한 값과 가져온 값이 동일하다');
});

test('이름 속성 가져오기', function () {
  var objA = wave.create('A');
  var objB = wave.create('B');

  equal(objA.get('name'), 'A', 'A 객체의 이름은 A');
  equal(objB.get('name'), 'B', 'B 객체의 이름은 B');
});

test('옵션으로 속성 설정하기', function () {
  var src = '../sounds/bark';
  var obj = wave.create('bark', {
    src: src
  });
  equal(obj.get('src'), src, '생성자의 옵션으로 전달한 값도 속성에 할당된다.');
});

test('set 속성으로 옵션 덮어쓰기', function () {
  var srcA = '../sounds/kick';
  var srcB = '../sounds/bark';
  var obj = wave.create('bark', {
    src: srcA
  });
  obj.set('src', srcB);
  equal(obj.get('src'), srcB, 'set()으로 설정하면 옵션을 덮어쓴다.');
});

test('옵션에 트리거 설정하기', function () {
  var obj = wave.create('bark');
  var retval = false;
  obj._load = function () {
    retval = true;
  };
  obj.set('src', '../sounds/bark');
  equal(retval, true, 'src 에 값을 설정하면 load()가 호출된다.');
});

test('일회용 이벤트 등록하기', function () {
  var obj = wave.create('bark');
  var retval = 0;
  obj.once('play', function () {
    retval++;
  });

  obj.trigger('play');
  obj.trigger('play');
  equal(retval, 1, 'once()로 등록한 경우 한 번만 호출된다.');
});

test('여러 객체에 이벤트 등록하기', function () {
  var objA = wave.create('A');
  var objB = wave.create('B');

  objA.on('play', function () {});
  objB.on('play', function () {});

  equal(1, objA.__eventMap.play.length);
  equal(1, objB.__eventMap.play.length);
});