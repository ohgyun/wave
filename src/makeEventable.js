define('makeEventable', [], function () {

  function makeEventable(obj) {

    var getEventMap = function () {
        this.__eventMap = this.__eventMap || {};
        return this.__eventMap;
      },

      validateEventExistence = function (name) {
        var eventMap = getEventMap.call(this);
        if (typeof eventMap[name] === 'undefined') {
          throw new Error('The event "' + name + '" is not defined.');
        }
      },

      shallowcopy = function (dest, source) {
        if ( ! source) { return dest; }

        for (var i in source) {
          if (source.hasOwnProperty(i)) {
            dest[i] = source[i];
          }
        }

        return dest;
      },

      register = function (name, handler, opts) {
        validateEventExistence.call(this, name);

        if (typeof handler !== 'function') {
          throw new Error('The handler of "' + name + '" should be a function.');
        }

        var eventMap = getEventMap.call(this);

        var info = shallowcopy({
          func: handler
        }, opts);

        eventMap[name].push(info);
      };

    obj.defineEvent = function (name) {
      var eventMap = getEventMap.call(this);
      eventMap[name] = [];
      return this;
    };

    obj.on = function (name, handler, opts) {
      register.call(this, name, handler);
      return this;
    };

    obj.once = function (name, handler) {
      register.call(this, name, handler, {
        once: true
      });
      return this;
    };

    obj.trigger = function (name/*, args ... */) {
      validateEventExistence.call(this, name);

      var eventMap = getEventMap.call(this);

      var handlerInfos = eventMap[name].slice(), // use copied
        args = Array.prototype.slice.call(arguments, 1),
        i = 0,
        len = handlerInfos.length,
        info;

      for (; i < len; i++) {
        info = handlerInfos[i];
        info.func.apply(this, args);

        if (info.once === true) {
          // splice from original array
          eventMap[name].splice(i, 1);
        }
      }

      return this;
    };

  }

  return makeEventable;

});