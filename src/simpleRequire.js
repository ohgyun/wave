/**
 * 모듈을 정의한다.
 * 라이브러리 내에서 의존성을 명확하게 구분하기 위해, AMD 스타일의 require/define을 사용한다.
 * 기본적인 사용법은 AMD에서 정의한 것과 동일하지만,
 * 라이브러리 내에서만 사용하는 용도이기 때문에, 간단함을 위해 다음과 같은 제한 사항이 있다.
 *   - 필요하신 시점에 모듈을 생성하지 않는다. define() 호출과 동시에 생성한다.
 *   - deps 모듈은 이미 모두 정의되어 있다고 가정한다. 즉, deps 목록에 있는 모듈을 먼저 define() 해야 한다.
 *   - 파라미터는 name, deps, callback 모두를 받는다. 오버로딩은 지원하지 않는다.
 *
 * 예를 들어, 아래와 같이 정의할 수 있다.
 *    define('example',
 *        [ 'dep1', 'dep2' ], // dep1과 dep2는 미리 정의되어 있어야 한다.
 *        function (dep1, dep2) {
 *          // 두 객체를 파라미터로 받는다.
 *        });
 */
function define(name, deps, callback) {
  var depObjs = deps.map(function (depName) {
    return require(depName);
  });
  require._registry[name] = callback.apply(null, depObjs);
}

/**
 * 모듈을 가져온다.
 * define()과 마찬가지로 간단함을 위해 아래 방법으로만 사용한다.
 *   - require(모듈명) 으로만 사용한다.
 *   - 여러 개의 파라미터를 지원하거나, 콜백을 지원하지 않는다.
 *
 * 예를 들어, 아래와 같이 사용할 수 있다.
 *   var obj = require('example'); // 미리 정의한 example 모듈을 가져온다.
 */
function require(name) {
  var obj = require._registry[name];
  if (typeof obj === 'undefined') {
    throw new Error('Module "' + name + '" is not defined.');
  }
  return obj;
}
require._registry = {
  /* moduleName: obj */
};