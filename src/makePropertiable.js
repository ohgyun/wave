define('makePropertiable', [], function () {

  function makePropertiable(obj) {

    var getProps = function () {
        this.__props = this.__props || {};
        return this.__props;
      },
      emptyGet = function (currentValue) {
        return currentValue;
      },
      emptySet = function (newValue) {
        return newValue;
      },
      emptyOnset = function (newValue) {
        // do nothing
      },
      emptyValidate = function (newValue) {
        return true;
      },
      validateKeyExistence = function (key) {
        var props = getProps.call(this);
        if ( ! (key in props)) {
          throw new Error('Property "' + key + '" does not exist.');
        }
      };

    obj.defineProp = function (key, attr) {
      var prop = {
        value: attr.value,
        get: attr.get || emptyGet,
        set: attr.set || emptySet,
        validate: attr.validate || emptyValidate,
        onset: attr.onset || emptyOnset
      };

      getProps.call(this)[key] = prop;
    };

    obj.set = function (key, value) {
      validateKeyExistence.call(this, key);

      var prop = getProps.call(this)[key];

      if (prop.validate()) {
        prop.value = prop.set.call(this, value);
        prop.onset.call(this, prop.value);

      } else {
        throw new Error('The value "' + value + '" of "' + key + '" is invalid.');
      }

      return this;
    };

    obj.get = function (key) {
      validateKeyExistence.call(this, key);

      var prop = getProps.call(this)[key];

      return prop.get.call(this, prop.value);
    };

  }

  return makePropertiable;

});