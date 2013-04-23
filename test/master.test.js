module('마스터 노드', {
  setup: function () {
    wave.reset();
    wave.create('yes1', {
      src: '../sounds/yes1'
    });
  }
});

test('마스터 볼륨을 설정할 수 있다.', function () {
  equal(wave.volume(), 1, '마스터 노드의 기본 볼륨은 1이다.');

  wave.volume(0.5); // 마스터 노드의 볼륨을 0.5로 설정한다.
  wave('yes1').play();

  equal(wave.volume(), 0.5, '마스터 노드의 볼륨은 0.5');
});

test('마스터 볼륨을 음소거할 수 있다.', function () {
  wave.mute();
  wave('yes1').play(); // 음이 제거된 상태로 들리지 않는다.

  equal(wave.volume(), 0, '음소거 된 상태의 마스터 볼륨은 0이다.');
  equal(wave('yes1').volume(), 1, '사운드 객체의 볼륨값은 마스터 볼륨과 관계없이 1을 리턴한다.');
});