// Write your own demo script

title('wave - Web Audio Library For JavaScript Games.');

step('1. 사운드 로딩 및 재생', function () {

  before(function () {
    wave.reset();
  });

  item('사운드 객체 생성', function () {

    desc(function () {
      return '사운드를 객체를 생성하고 가져온다.';
    });

    code(function () {
      wave.create('yes1', {
        src: '../sounds/yes1'
      });
      var obj = wave('yes1'); // 생성할 때 전달한 이름으로 객체를 가져올 수 있다.
    });

  });

  item('객체 생성 후 로딩', function () {

    desc(function () {
      return '사운드는 src 속성을 설정하는 시점에 로딩을 시작한다.';
    });

    code(function () {
      var obj = wave.create('yes1');
      obj.set('src', '../sounds/yes1'); // 로딩 시작, 확장자는 전달하지 않는다.
    });

  });

  item('재생하기', function () {

    desc(function () {
      return 'play(delay) 메서드로 재생할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1'
      });
      obj.play();
    });

  });

  item('자동 재생하기', function () {

    desc(function () {
      return 'autoplay 속성으로 로딩 후 자동 재생할 수 있다.';
    });

    code(function () {
      wave.create('yes2', {
        src: '../sounds/yes2',
        autoplay: true
      });
    });

  });

  item('일시 정지', function () {

    desc(function () {
      return 'pause(delay)로 일시 정지할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1'
      });

      obj.play();
      obj.pause(0.5);
      obj.play(1); // 0.5후 일시정지하고, 1초 후 다시 재생한다.
    });
  });

  item('정지', function () {

    desc(function () {
      return 'stop(delay)로 정지할 수 있다.';
    });

    code(function () {
      wave.create('yes1', {
        src: '../sounds/yes1'
      }).play();

      wave('yes1').stop(0.5); // 0.5초 후 정지한다.
    });

  });

  item('이벤트 처리', function () {

    function printMessage(msg) {
      m.print(msg);
    }

    desc(function () {
      return 'play, pause, stop, end에 대한 이벤트를 등록할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1'
      });

      obj.once('play', function () {
          printMessage('play..');
        })
        .once('end', function () {
          printMessage('end..');
        })
        .play();
      // on() 또는 once()로 이벤트를 할당할 수 있다.

    });

  });
});

step('2. 볼륨 조절', function () {

  before(function () {
    wave.reset();
  });

  item('볼륨 설정', function () {

    desc(function () {
      return 'volume()으로 값을 가져오거나 설정할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1'
      });
      obj.volume(0.5);
      obj.play();
    });

  });

  item('음소거', function () {

    desc(function () {
      return 'mute() / unmute()로 음소거할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1',
        volume: 1
      });

      obj.mute();
      obj.play();

      setTimeout(function () {
        obj.unmute();
        obj.play();
      }, 1000);

    });

  });

  item('마스터 볼륨', function () {

    desc(function () {
      return 'wave.volume()으로 마스터 볼륨을 설정할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1',
        volume: 1
      });

      wave.volume(0.5);
      obj.play();
    });

  });

  item('마스터 음소거', function () {

    desc(function () {
      return 'wave.mute() / wave.unmute()로 마스터 음소거를 설정할 수 있다.';
    });

    code(function () {
      var obj = wave.create('yes1', {
        src: '../sounds/yes1',
        volume: 1
      });

      wave.mute();
      obj.play();

      setTimeout(function () {
        wave.unmute();
        obj.play();
      }, 1000);
    });

  });

});

step('3. 다양화', function () {

  before(function () {
    wave.reset();
  });

  item('연속 재생하기', function () {

    desc(function() {
      return '이전 재생하던 음원은 정지된다.';
    });

    code(function () {
      var obj = wave.create('coin', {
        src: '../sounds/coin'
      });

      obj.play();
      obj.play(0.1);
      obj.play(0.2);
    });

  });

  item('중첩 재생하기', function () {

    desc(function() {
      return 'nestedPlay 옵션으로, 중첩 재생할 수 있다.';
    });

    code(function () {
      var obj = wave.create('coin2', {
        src: '../sounds/coin',
        nestedPlay: true
      });

      obj.play();
      obj.play(0.1);
      obj.play(0.2);
    });

  });

  item('여러 음원 재생하기', function () {

    desc(function () {
      return 'src 값을 여러 개 넘기면 랜덤으로 하나를 골라 재생한다.';
    });

    code(function () {
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
      // 재생할 때마다 랜덤으로 한 개의 음원을 고른다.
    });

  });

  item('볼륨 랜덤하게 적용하기', function () {

    desc(function () {
      return 'volumeVariation 옵션으로, 재생할 때마다 다양한 볼륨을 적용할 수 있다.';
    });

    code(function () {
      var obj = wave.create('coin3', {
        src: '../sounds/coin',
        volumeVariation: true,
        nestedPlay: true
      });

      for (var i = 0; i < 5; i++) {
        obj.play(i * 0.1);
      }
      // true로 설정하는 경우, 기본 볼륨의 상/하 30% 범위에서 랜덤으로 설정한다.
    });

  });

  item('음높이 랜덤하게 적용하기', function () {

    desc(function () {
      return 'pitchVariation 옵션으로, 재생할 때마다 다양한 음높이를 적용할 수 있다.';
    });

    code(function () {
      var obj = wave.create('coin4', {
        src: '../sounds/coin',
        pitch: 1,
        pitchVariation: [-0.02, 0.02],
        nestedPlay: true
      });

      for (var i = 0; i < 10; i++) {
        obj.play(i * 0.1);
      }
      // true로 설정하는 경우, 기본 음높이의 상/하 30% 범위에서 랜덤으로 설정한다.
    });

  });

  item('믹싱', function () {

    desc(function () {
      return '여러 음원을 섞어서 하나의 음원처러 처림할 수 있다.';
    });

    code(function () {

      wave.create('coin', {
        src: '../sounds/coin'
      });

      wave.create('sounds-good', {
        src: '../sounds/yes1'
      });

      wave.mix('multi-coin', [
        'coin', 'sounds-good'
      ], function (coin, soundsGood) {
        coin.set('nestedPlay', true);
        coin.set('pitch', 0.8);
        coin.set('pitchVariation', [-0.02, 0.02]);

        for (var i = 0; i < 5; i++) {
          coin.play(i * 0.1);
        }

        soundsGood.set('nestedPlay', true);
        soundsGood.play(0.6);
        soundsGood.play(0.7);
      });

      wave('multi-coin').play();
    });
  });

});

run(0);