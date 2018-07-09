(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global['redux-grim'] = {})));
}(this, (function (exports) { 'use strict';

// The actions and reducers created by makeAction and makeReducer share a common
// method for modifying actions are reducer states: 'on'.
// E.g. on('start, () => ...).
//
// 'on' callbacks are executed in the order they are added, and the first
// parameter is the object to be modified (an action for makeAction, and the
// new state for makeReducer). Each callback must return the object, or its
// modified version, as callbacks are chained, the return value becoming the
// first parameter of the next call.
//

/**
 * @param target {Object} - object to which the 'on' function will be added.
 * @param hooks {Object} - a object consisting of a set of initials functions.
 *  also defined which hooks are valid for 'on'.
 * @returns target - the original target, so allow easy chaining.
 */
function addHooks(target, hooks) {
  target.on = function (hook, fn) {
    if (!hook in hooks) throw "invalid hook " + hook;

    var previousHook = hooks[hook];
    if (previousHook) {
      hooks[hook] = function (first) {
        for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          rest[_key - 1] = arguments[_key];
        }

        return fn.apply(undefined, [previousHook.apply(undefined, [first].concat(rest))].concat(rest));
      };
    } else {
      hooks[hook] = fn;
    }
    return target;
  };
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var bodyMethods = ['put', 'patch', 'post'];

// Regex to match the contents of () brackets
var parensReg = /\(([^)]+)\)/g; //

// Regex to match the contents of [] brackets
var squareParensReg = /\[([^)]+)\]/g;

// Actions can be modified using the 'on' method.
// E.g. action.on('start', () => ..)
//
// This is a list of the possible values callback function is called with, and
// the parameters they will be passed.
// Each function must return the action, modified or otherwise.
//
// action - the action that was created by makeAction.
// _namedParams - an object mapping from parameter name in the url to the value
// that was passed to the action.
// _restArgs - array of the rest of the params that were passed to the action.
// _options - options object that was passed to makeAction
var defaultHooks = {
  start: function start(action, _namedParams, _restArgs, _options) {
    return action;
  },
  success: function success(action, _namedParams, _restArgs, _options) {
    return action;
  },
  error: function error(action, _namedParams, _restArgs, _options) {
    return action;
  },
  // All applies to start, success, and error actions
  all: function all(action, _namedParams, _restArgs, _options) {
    return action;
  }
};

// Some default behaviours when creating actions, that can be overridden.
// apiFetch allows the fetch behaviour to be modified. restArgs - the parameters
//  that were passed to the action after those specified by the url, are also
//  passed to this function.
var defaultFunctions = {
  apiFetch: function apiFetch(method, url, body) {
    return (
      // eslint-disable-next-line compat/compat
      fetch(url, {
        method: method.toUpperCase(),
        body: JSON.stringify(body)
      })
    );
  }
};

/**
 * Return true if the api and action functions require an object parameter
 * @param {String} method
 * @param {String} templateUrl
 * @returns boolean
 */
function hasBodyParam(method, templateUrl) {
  return bodyMethods.includes(method) || method === 'delete' && templateUrl.includes('[');
}

/**
 * Extract an array of the named parameters in the url.
 *
 * E.g '/zone/(zoneId)/pool/[id]' -> ['zoneId', 'body'];
 *
 * If
 * @param {String} method
 * @param {String} templateUrl
 * @returns {Array}
 */
function getNamedParameters(method, templateUrl) {
  var params = new Set();
  var match = void 0;
  while (match = parensReg.exec(templateUrl)) {
    // Urls can reference the same object multiple times.
    // E.g. /(zone.id)/(zone.organization.id)
    // This will only add one named parameter to the array ('zone')
    var str = match[1];
    var periodIndex = str.indexOf('.');
    params.add(periodIndex === -1 ? str : str.substr(0, str.indexOf('.')));
  }
  if (hasBodyParam(method, templateUrl)) {
    params.add('body');
  }
  return params.size ? [].concat(toConsumableArray(params)) : [];
}

/**
 * Return a function that evaluates the url, using a params object to populate
 * the variable parts of the url.
 *
 * NOTE: Babel can't compile things that are inside of eval() or new Function(),
 * makeActionCreator() was using back-ticks (string templates) inside of new Function()
 * which busts IE11. So please use good old '+ foo +' in cases like this!
 *
 * E.g. const evaluate = makeUrlEvaluator('/zone/(zoneId)/pool/[id]');
 *      evaluate({ zoneId: 123, body: { id: 456 }})
 *      -> '/zone/123/create/456';
 *
 * @param {String} templateUrl
 * @returns {Function}
 */
function makeUrlEvaluator(templateUrl) {
  var url = templateUrl
  // E.g. /(foo) -> /${params.foo}
  .replace(parensReg, "'+params.$1+'")
  // Adding empty [] to a delete url creates an action which takes a body param
  .replace('[]', '')
  // E.g. /[foo] -> /${params.body.foo}
  .replace(squareParensReg, "'+params.body.$1+'");
  return new Function('params', "return '" + url + "';");
}

/**
 * Returns a function which evaluates the tempalte url, with the action
 * arguments and returns an object containing the evaluated url, an object
 * mapping the named parameters to their actual values, and the rest of the
 * arguments supplied to the action.
 *
 * @param templateUrl {String}
 * @param namedParams {Array}
 * @returns {function}
 */
function makeGetApiData(templateUrl, namedParams) {
  var urlEvaluator = makeUrlEvaluator(templateUrl);

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var params = namedParams.reduce(function (o, param, ii) {
      o[param] = args[ii];
      return o;
    }, {});

    return {
      url: urlEvaluator(params),
      params: params,
      restArgs: args.slice(namedParams.length)
    };
  };
}

/**
 * Create an asynchronous actions to access http resources.
 *
 * @param entityType {String} - used to create action types and match actions
 *   and reducers
 * @param method {String} - http method (get, post, etc)
 * @param templateUrl {String} - defines the url to access and the parameters
 *   which the action will accept. See the readme for for information.
 * @param options {Object} - An object which will be passed to the various
 *  hook functions. By default, this can only be used to log action creation,
 *  or a mismatch between expected parameters of an action and what is actually
 *  passed, by setting options = { debug: true }
 *
 */
function makeActionCreator(entityType, method, templateUrl) {
  var _this = this;

  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var namedParams = getNamedParameters(method, templateUrl);
  options.debug && logActionCreation(entityType, method, templateUrl, namedParams);

  var mock = void 0;
  var hooks = _extends({}, defaultHooks);
  var functions = _extends({}, defaultFunctions);
  var getApiData = makeGetApiData(templateUrl, namedParams);

  var action = function action() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(dispatch) {
        var _getApiData, url, params, restArgs, startAction, mockValue, response, successAction, result, errorAction;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (options.debug) {
                  validateActionParameters(entityType, method, templateUrl, args, namedParams);
                }

                _getApiData = getApiData.apply(undefined, args), url = _getApiData.url, params = _getApiData.params, restArgs = _getApiData.restArgs;
                startAction = {
                  type: entityType + '.start',
                  meta: {
                    entityType: entityType,
                    method: method
                  }
                };

                startAction = hooks.start(startAction, params, restArgs, options);
                startAction = hooks.all(startAction, params, restArgs, options);
                dispatch(startAction);

                _context.prev = 6;
                mockValue = void 0, response = void 0;

                if (mock !== undefined) {
                  mockValue = typeof mock === 'function' ? mock.apply(undefined, args) : mock;
                  response = mockValue === undefined ? undefined : { body: mockValue };
                  response && console.info('Mocking ' + method + ' ' + templateUrl, mockValue);
                }
                _context.t0 = response;

                if (_context.t0) {
                  _context.next = 14;
                  break;
                }

                _context.next = 13;
                return functions.apiFetch.apply(functions, [method, url, params.body].concat(toConsumableArray(restArgs)));

              case 13:
                _context.t0 = _context.sent;

              case 14:
                response = _context.t0;
                successAction = {
                  type: entityType + '.success',
                  payload: response && response.body,
                  meta: {
                    entityType: entityType,
                    method: method
                  }
                };


                successAction = hooks.success(successAction, params, restArgs, options, response);

                successAction = hooks.all(successAction, params, restArgs, options, response);

                result = successAction.payload;

                dispatch(successAction);
                return _context.abrupt('return', result);

              case 23:
                _context.prev = 23;
                _context.t1 = _context['catch'](6);
                errorAction = {
                  type: entityType + '.error',
                  payload: _context.t1,
                  error: true,
                  meta: {
                    entityType: entityType,
                    method: method
                  }
                };

                errorAction = hooks.error(errorAction, params, restArgs, options, _context.t1);
                errorAction = hooks.all(errorAction, params, restArgs, options, _context.t1);
                dispatch(errorAction);
                throw _context.t1;

              case 30:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this, [[6, 23]]);
      }));

      return function (_x2) {
        return _ref.apply(this, arguments);
      };
    }();
  };

  // All these functions return the action so they can be chained.
  addHooks(action, hooks);
  action.apiFetch = function (fn) {
    return functions.apiFetch = fn, action;
  };
  action.mock = function (fn) {
    return mock = fn, action;
  };
  action.unmock = function () {
    return mock = undefined, action;
  };
  return action;
}

/**
 * Called automatically when options = { debug: true }, to log information
 * about action creation.
 */
function logActionCreation(entityType, method, url, namedParams) {
  console.log('Created action ' + entityType + ', ' + url + ', ' + method + '(' + namedParams.join(', ') + ')');
}

/**
 * Called automatically when options = { debug: true } to warn when there's
 * mismatch between the expected parameters of an action and what's actually
 * created.
 */
function validateActionParameters(entityType, method, url, args, namedParams) {
  var hasBody = url.indexOf('[') > -1 || ['post', 'put', 'patch'].includes(method);

  // All parameters should be strings or numbers, unless there's a body, in
  // which case the last parameter is an object.
  if (args.length < namedParams.length) {
    console.warn('For api call ' + entityType + ', ' + method + ', ' + url + ',\n         Expected parameters: ' + namedParams.join(', ') + '\n         Actual parameters: ' + args.join(', ') + '\n      ');
  }
  namedParams.forEach(function (param, ii) {
    var type = _typeof(args[ii]);
    if (hasBody && ii === namedParams.length - 1) {
      if (type !== 'object') {
        console.warn(entityType + ', ' + method + ', ' + url + ': Expected parameter ' + param + ' to be an object. Actual value: ' + args[ii] + ' ' + type);
      }
    } else if (type !== 'string' && type !== 'number') {
      console.warn(entityType + ', ' + method + ', ' + url + ': Expected parameter ' + param + ' to be a string or number. Actual value: ' + args[ii]);
    }
  });
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var seamlessImmutable_development = createCommonjsModule(function (module, exports) {
(function() {

function immutableInit(config) {

  // https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L21
  var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element');
  var REACT_ELEMENT_TYPE_FALLBACK = 0xeac7;

  var globalConfig = {
    use_static: false
  };
  if (isObject(config)) {
      if (config.use_static !== undefined) {
          globalConfig.use_static = Boolean(config.use_static);
      }
  }

  function isObject(data) {
    return (
      typeof data === 'object' &&
      !Array.isArray(data) &&
      data !== null
    );
  }

  function instantiateEmptyObject(obj) {
      var prototype = Object.getPrototypeOf(obj);
      if (!prototype) {
          return {};
      } else {
          return Object.create(prototype);
      }
  }

  function addPropertyTo(target, methodName, value) {
    Object.defineProperty(target, methodName, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  }

  function banProperty(target, methodName) {
    addPropertyTo(target, methodName, function() {
      throw new ImmutableError("The " + methodName +
        " method cannot be invoked on an Immutable data structure.");
    });
  }

  var immutabilityTag = "__immutable_invariants_hold";

  function addImmutabilityTag(target) {
    addPropertyTo(target, immutabilityTag, true);
  }

  function isImmutable(target) {
    if (typeof target === "object") {
      return target === null || Boolean(
        Object.getOwnPropertyDescriptor(target, immutabilityTag)
      );
    } else {
      // In JavaScript, only objects are even potentially mutable.
      // strings, numbers, null, and undefined are all naturally immutable.
      return true;
    }
  }

  function isEqual(a, b) {
    // Avoid false positives due to (NaN !== NaN) evaluating to true
    return (a === b || (a !== a && b !== b));
  }

  function isMergableObject(target) {
    return target !== null && typeof target === "object" && !(Array.isArray(target)) && !(target instanceof Date);
  }

  var mutatingObjectMethods = [
    "setPrototypeOf"
  ];

  var nonMutatingObjectMethods = [
    "keys"
  ];

  var mutatingArrayMethods = mutatingObjectMethods.concat([
    "push", "pop", "sort", "splice", "shift", "unshift", "reverse"
  ]);

  var nonMutatingArrayMethods = nonMutatingObjectMethods.concat([
    "map", "filter", "slice", "concat", "reduce", "reduceRight"
  ]);

  var mutatingDateMethods = mutatingObjectMethods.concat([
    "setDate", "setFullYear", "setHours", "setMilliseconds", "setMinutes", "setMonth", "setSeconds",
    "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes",
    "setUTCMonth", "setUTCSeconds", "setYear"
  ]);

  function ImmutableError(message) {
    this.name = 'MyError';
    this.message = message;
    this.stack = (new Error()).stack;
  }
  ImmutableError.prototype = new Error();
  ImmutableError.prototype.constructor = Error;

  function makeImmutable(obj, bannedMethods) {
    // Tag it so we can quickly tell it's immutable later.
    addImmutabilityTag(obj);

    {
      // Make all mutating methods throw exceptions.
      for (var index in bannedMethods) {
        if (bannedMethods.hasOwnProperty(index)) {
          banProperty(obj, bannedMethods[index]);
        }
      }

      // Freeze it and return it.
      Object.freeze(obj);
    }

    return obj;
  }

  function makeMethodReturnImmutable(obj, methodName) {
    var currentMethod = obj[methodName];

    addPropertyTo(obj, methodName, function() {
      return Immutable(currentMethod.apply(obj, arguments));
    });
  }

  function arraySet(idx, value, config) {
    var deep          = config && config.deep;

    if (idx in this) {
      if (deep && this[idx] !== value && isMergableObject(value) && isMergableObject(this[idx])) {
        value = Immutable.merge(this[idx], value, {deep: true, mode: 'replace'});
      }
      if (isEqual(this[idx], value)) {
        return this;
      }
    }

    var mutable = asMutableArray.call(this);
    mutable[idx] = Immutable(value);
    return makeImmutableArray(mutable);
  }

  var immutableEmptyArray = Immutable([]);

  function arraySetIn(pth, value, config) {
    var head = pth[0];

    if (pth.length === 1) {
      return arraySet.call(this, head, value, config);
    } else {
      var tail = pth.slice(1);
      var thisHead = this[head];
      var newValue;

      if (typeof(thisHead) === "object" && thisHead !== null) {
        // Might (validly) be object or array
        newValue = Immutable.setIn(thisHead, tail, value);
      } else {
        var nextHead = tail[0];
        // If the next path part is a number, then we are setting into an array, else an object.
        if (nextHead !== '' && isFinite(nextHead)) {
          newValue = arraySetIn.call(immutableEmptyArray, tail, value);
        } else {
          newValue = objectSetIn.call(immutableEmptyObject, tail, value);
        }
      }

      if (head in this && thisHead === newValue) {
        return this;
      }

      var mutable = asMutableArray.call(this);
      mutable[head] = newValue;
      return makeImmutableArray(mutable);
    }
  }

  function makeImmutableArray(array) {
    // Don't change their implementations, but wrap these functions to make sure
    // they always return an immutable value.
    for (var index in nonMutatingArrayMethods) {
      if (nonMutatingArrayMethods.hasOwnProperty(index)) {
        var methodName = nonMutatingArrayMethods[index];
        makeMethodReturnImmutable(array, methodName);
      }
    }

    if (!globalConfig.use_static) {
      addPropertyTo(array, "flatMap",  flatMap);
      addPropertyTo(array, "asObject", asObject);
      addPropertyTo(array, "asMutable", asMutableArray);
      addPropertyTo(array, "set", arraySet);
      addPropertyTo(array, "setIn", arraySetIn);
      addPropertyTo(array, "update", update);
      addPropertyTo(array, "updateIn", updateIn);
      addPropertyTo(array, "getIn", getIn);
    }

    for(var i = 0, length = array.length; i < length; i++) {
      array[i] = Immutable(array[i]);
    }

    return makeImmutable(array, mutatingArrayMethods);
  }

  function makeImmutableDate(date) {
    if (!globalConfig.use_static) {
      addPropertyTo(date, "asMutable", asMutableDate);
    }

    return makeImmutable(date, mutatingDateMethods);
  }

  function asMutableDate() {
    return new Date(this.getTime());
  }

  /**
   * Effectively performs a map() over the elements in the array, using the
   * provided iterator, except that whenever the iterator returns an array, that
   * array's elements are added to the final result instead of the array itself.
   *
   * @param {function} iterator - The iterator function that will be invoked on each element in the array. It will receive three arguments: the current value, the current index, and the current object.
   */
  function flatMap(iterator) {
    // Calling .flatMap() with no arguments is a no-op. Don't bother cloning.
    if (arguments.length === 0) {
      return this;
    }

    var result = [],
        length = this.length,
        index;

    for (index = 0; index < length; index++) {
      var iteratorResult = iterator(this[index], index, this);

      if (Array.isArray(iteratorResult)) {
        // Concatenate Array results into the return value we're building up.
        result.push.apply(result, iteratorResult);
      } else {
        // Handle non-Array results the same way map() does.
        result.push(iteratorResult);
      }
    }

    return makeImmutableArray(result);
  }

  /**
   * Returns an Immutable copy of the object without the given keys included.
   *
   * @param {array} keysToRemove - A list of strings representing the keys to exclude in the return value. Instead of providing a single array, this method can also be called by passing multiple strings as separate arguments.
   */
  function without(remove) {
    // Calling .without() with no arguments is a no-op. Don't bother cloning.
    if (typeof remove === "undefined" && arguments.length === 0) {
      return this;
    }

    if (typeof remove !== "function") {
      // If we weren't given an array, use the arguments list.
      var keysToRemoveArray = (Array.isArray(remove)) ?
         remove.slice() : Array.prototype.slice.call(arguments);

      // Convert numeric keys to strings since that's how they'll
      // come from the enumeration of the object.
      keysToRemoveArray.forEach(function(el, idx, arr) {
        if(typeof(el) === "number") {
          arr[idx] = el.toString();
        }
      });

      remove = function(val, key) {
        return keysToRemoveArray.indexOf(key) !== -1;
      };
    }

    var result = instantiateEmptyObject(this);

    for (var key in this) {
      if (this.hasOwnProperty(key) && remove(this[key], key) === false) {
        result[key] = this[key];
      }
    }

    return makeImmutableObject(result);
  }

  function asMutableArray(opts) {
    var result = [], i, length;

    if(opts && opts.deep) {
      for(i = 0, length = this.length; i < length; i++) {
        result.push(asDeepMutable(this[i]));
      }
    } else {
      for(i = 0, length = this.length; i < length; i++) {
        result.push(this[i]);
      }
    }

    return result;
  }

  /**
   * Effectively performs a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) over the elements in the array, expecting that the iterator function
   * will return an array of two elements - the first representing a key, the other
   * a value. Then returns an Immutable Object constructed of those keys and values.
   *
   * @param {function} iterator - A function which should return an array of two elements - the first representing the desired key, the other the desired value.
   */
  function asObject(iterator) {
    // If no iterator was provided, assume the identity function
    // (suggesting this array is already a list of key/value pairs.)
    if (typeof iterator !== "function") {
      iterator = function(value) { return value; };
    }

    var result = {},
        length = this.length,
        index;

    for (index = 0; index < length; index++) {
      var pair  = iterator(this[index], index, this),
          key   = pair[0],
          value = pair[1];

      result[key] = value;
    }

    return makeImmutableObject(result);
  }

  function asDeepMutable(obj) {
    if (
      (!obj) ||
      (typeof obj !== 'object') ||
      (!Object.getOwnPropertyDescriptor(obj, immutabilityTag)) ||
      (obj instanceof Date)
    ) { return obj; }
    return Immutable.asMutable(obj, {deep: true});
  }

  function quickCopy(src, dest) {
    for (var key in src) {
      if (Object.getOwnPropertyDescriptor(src, key)) {
        dest[key] = src[key];
      }
    }

    return dest;
  }

  /**
   * Returns an Immutable Object containing the properties and values of both
   * this object and the provided object, prioritizing the provided object's
   * values whenever the same key is present in both objects.
   *
   * @param {object} other - The other object to merge. Multiple objects can be passed as an array. In such a case, the later an object appears in that list, the higher its priority.
   * @param {object} config - Optional config object that contains settings. Supported settings are: {deep: true} for deep merge and {merger: mergerFunc} where mergerFunc is a function
   *                          that takes a property from both objects. If anything is returned it overrides the normal merge behaviour.
   */
  function merge(other, config) {
    // Calling .merge() with no arguments is a no-op. Don't bother cloning.
    if (arguments.length === 0) {
      return this;
    }

    if (other === null || (typeof other !== "object")) {
      throw new TypeError("Immutable#merge can only be invoked with objects or arrays, not " + JSON.stringify(other));
    }

    var receivedArray = (Array.isArray(other)),
        deep          = config && config.deep,
        mode          = config && config.mode || 'merge',
        merger        = config && config.merger,
        result;

    // Use the given key to extract a value from the given object, then place
    // that value in the result object under the same key. If that resulted
    // in a change from this object's value at that key, set anyChanges = true.
    function addToResult(currentObj, otherObj, key) {
      var immutableValue = Immutable(otherObj[key]);
      var mergerResult = merger && merger(currentObj[key], immutableValue, config);
      var currentValue = currentObj[key];

      if ((result !== undefined) ||
        (mergerResult !== undefined) ||
        (!currentObj.hasOwnProperty(key)) ||
        !isEqual(immutableValue, currentValue)) {

        var newValue;

        if (mergerResult) {
          newValue = mergerResult;
        } else if (deep && isMergableObject(currentValue) && isMergableObject(immutableValue)) {
          newValue = Immutable.merge(currentValue, immutableValue, config);
        } else {
          newValue = immutableValue;
        }

        if (!isEqual(currentValue, newValue) || !currentObj.hasOwnProperty(key)) {
          if (result === undefined) {
            // Make a shallow clone of the current object.
            result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
          }

          result[key] = newValue;
        }
      }
    }

    function clearDroppedKeys(currentObj, otherObj) {
      for (var key in currentObj) {
        if (!otherObj.hasOwnProperty(key)) {
          if (result === undefined) {
            // Make a shallow clone of the current object.
            result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
          }
          delete result[key];
        }
      }
    }

    var key;

    // Achieve prioritization by overriding previous values that get in the way.
    if (!receivedArray) {
      // The most common use case: just merge one object into the existing one.
      for (key in other) {
        if (Object.getOwnPropertyDescriptor(other, key)) {
          addToResult(this, other, key);
        }
      }
      if (mode === 'replace') {
        clearDroppedKeys(this, other);
      }
    } else {
      // We also accept an Array
      for (var index = 0, length = other.length; index < length; index++) {
        var otherFromArray = other[index];

        for (key in otherFromArray) {
          if (otherFromArray.hasOwnProperty(key)) {
            addToResult(result !== undefined ? result : this, otherFromArray, key);
          }
        }
      }
    }

    if (result === undefined) {
      return this;
    } else {
      return makeImmutableObject(result);
    }
  }

  function objectReplace(value, config) {
    var deep          = config && config.deep;

    // Calling .replace() with no arguments is a no-op. Don't bother cloning.
    if (arguments.length === 0) {
      return this;
    }

    if (value === null || typeof value !== "object") {
      throw new TypeError("Immutable#replace can only be invoked with objects or arrays, not " + JSON.stringify(value));
    }

    return Immutable.merge(this, value, {deep: deep, mode: 'replace'});
  }

  var immutableEmptyObject = Immutable({});

  function objectSetIn(path, value, config) {
    if (!(Array.isArray(path)) || path.length === 0) {
      throw new TypeError("The first argument to Immutable#setIn must be an array containing at least one \"key\" string.");
    }

    var head = path[0];
    if (path.length === 1) {
      return objectSet.call(this, head, value, config);
    }

    var tail = path.slice(1);
    var newValue;
    var thisHead = this[head];

    if (this.hasOwnProperty(head) && typeof(thisHead) === "object" && thisHead !== null) {
      // Might (validly) be object or array
      newValue = Immutable.setIn(thisHead, tail, value);
    } else {
      newValue = objectSetIn.call(immutableEmptyObject, tail, value);
    }

    if (this.hasOwnProperty(head) && thisHead === newValue) {
      return this;
    }

    var mutable = quickCopy(this, instantiateEmptyObject(this));
    mutable[head] = newValue;
    return makeImmutableObject(mutable);
  }

  function objectSet(property, value, config) {
    var deep          = config && config.deep;

    if (this.hasOwnProperty(property)) {
      if (deep && this[property] !== value && isMergableObject(value) && isMergableObject(this[property])) {
        value = Immutable.merge(this[property], value, {deep: true, mode: 'replace'});
      }
      if (isEqual(this[property], value)) {
        return this;
      }
    }

    var mutable = quickCopy(this, instantiateEmptyObject(this));
    mutable[property] = Immutable(value);
    return makeImmutableObject(mutable);
  }

  function update(property, updater) {
    var restArgs = Array.prototype.slice.call(arguments, 2);
    var initialVal = this[property];
    return Immutable.set(this, property, updater.apply(initialVal, [initialVal].concat(restArgs)));
  }

  function getInPath(obj, path) {
    /*jshint eqnull:true */
    for (var i = 0, l = path.length; obj != null && i < l; i++) {
      obj = obj[path[i]];
    }

    return (i && i == l) ? obj : undefined;
  }

  function updateIn(path, updater) {
    var restArgs = Array.prototype.slice.call(arguments, 2);
    var initialVal = getInPath(this, path);

    return Immutable.setIn(this, path, updater.apply(initialVal, [initialVal].concat(restArgs)));
  }

  function getIn(path, defaultValue) {
    var value = getInPath(this, path);
    return value === undefined ? defaultValue : value;
  }

  function asMutableObject(opts) {
    var result = instantiateEmptyObject(this), key;

    if(opts && opts.deep) {
      for (key in this) {
        if (this.hasOwnProperty(key)) {
          result[key] = asDeepMutable(this[key]);
        }
      }
    } else {
      for (key in this) {
        if (this.hasOwnProperty(key)) {
          result[key] = this[key];
        }
      }
    }

    return result;
  }

  // Creates plain object to be used for cloning
  function instantiatePlainObject() {
    return {};
  }

  // Finalizes an object with immutable methods, freezes it, and returns it.
  function makeImmutableObject(obj) {
    if (!globalConfig.use_static) {
      addPropertyTo(obj, "merge", merge);
      addPropertyTo(obj, "replace", objectReplace);
      addPropertyTo(obj, "without", without);
      addPropertyTo(obj, "asMutable", asMutableObject);
      addPropertyTo(obj, "set", objectSet);
      addPropertyTo(obj, "setIn", objectSetIn);
      addPropertyTo(obj, "update", update);
      addPropertyTo(obj, "updateIn", updateIn);
      addPropertyTo(obj, "getIn", getIn);
    }

    return makeImmutable(obj, mutatingObjectMethods);
  }

  // Returns true if object is a valid react element
  // https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L326
  function isReactElement(obj) {
    return typeof obj === 'object' &&
           obj !== null &&
           (obj.$$typeof === REACT_ELEMENT_TYPE_FALLBACK || obj.$$typeof === REACT_ELEMENT_TYPE);
  }

  function isFileObject(obj) {
    return typeof File !== 'undefined' &&
           obj instanceof File;
  }

  function isBlobObject(obj) {
    return typeof Blob !== 'undefined' &&
           obj instanceof Blob;
  }

  function isPromise(obj) {
    return typeof obj === 'object' &&
           typeof obj.then === 'function';
  }

  function isError(obj) {
    return obj instanceof Error;
  }

  function Immutable(obj, options, stackRemaining) {
    if (isImmutable(obj) || isReactElement(obj) || isFileObject(obj) || isBlobObject(obj) || isError(obj)) {
      return obj;
    } else if (isPromise(obj)) {
      return obj.then(Immutable);
    } else if (Array.isArray(obj)) {
      return makeImmutableArray(obj.slice());
    } else if (obj instanceof Date) {
      return makeImmutableDate(new Date(obj.getTime()));
    } else {
      // Don't freeze the object we were given; make a clone and use that.
      var prototype = options && options.prototype;
      var instantiateEmptyObject =
        (!prototype || prototype === Object.prototype) ?
          instantiatePlainObject : (function() { return Object.create(prototype); });
      var clone = instantiateEmptyObject();

      {
        /*jshint eqnull:true */
        if (stackRemaining == null) {
          stackRemaining = 64;
        }
        if (stackRemaining <= 0) {
          throw new ImmutableError("Attempt to construct Immutable from a deeply nested object was detected." +
            " Have you tried to wrap an object with circular references (e.g. React element)?" +
            " See https://github.com/rtfeldman/seamless-immutable/wiki/Deeply-nested-object-was-detected for details.");
        }
        stackRemaining -= 1;
      }

      for (var key in obj) {
        if (Object.getOwnPropertyDescriptor(obj, key)) {
          clone[key] = Immutable(obj[key], undefined, stackRemaining);
        }
      }

      return makeImmutableObject(clone);
    }
  }

  // Wrapper to allow the use of object methods as static methods of Immutable.
  function toStatic(fn) {
    function staticWrapper() {
      var args = [].slice.call(arguments);
      var self = args.shift();
      return fn.apply(self, args);
    }

    return staticWrapper;
  }

  // Wrapper to allow the use of object methods as static methods of Immutable.
  // with the additional condition of choosing which function to call depending
  // if argument is an array or an object.
  function toStaticObjectOrArray(fnObject, fnArray) {
    function staticWrapper() {
      var args = [].slice.call(arguments);
      var self = args.shift();
      if (Array.isArray(self)) {
          return fnArray.apply(self, args);
      } else {
          return fnObject.apply(self, args);
      }
    }

    return staticWrapper;
  }

  // Wrapper to allow the use of object methods as static methods of Immutable.
  // with the additional condition of choosing which function to call depending
  // if argument is an array or an object or a date.
  function toStaticObjectOrDateOrArray(fnObject, fnArray, fnDate) {
    function staticWrapper() {
      var args = [].slice.call(arguments);
      var self = args.shift();
      if (Array.isArray(self)) {
          return fnArray.apply(self, args);
      } else if (self instanceof Date) {
          return fnDate.apply(self, args);
      } else {
          return fnObject.apply(self, args);
      }
    }

    return staticWrapper;
  }

  // Export the library
  Immutable.from           = Immutable;
  Immutable.isImmutable    = isImmutable;
  Immutable.ImmutableError = ImmutableError;
  Immutable.merge          = toStatic(merge);
  Immutable.replace        = toStatic(objectReplace);
  Immutable.without        = toStatic(without);
  Immutable.asMutable      = toStaticObjectOrDateOrArray(asMutableObject, asMutableArray, asMutableDate);
  Immutable.set            = toStaticObjectOrArray(objectSet, arraySet);
  Immutable.setIn          = toStaticObjectOrArray(objectSetIn, arraySetIn);
  Immutable.update         = toStatic(update);
  Immutable.updateIn       = toStatic(updateIn);
  Immutable.getIn          = toStatic(getIn);
  Immutable.flatMap        = toStatic(flatMap);
  Immutable.asObject       = toStatic(asObject);
  if (!globalConfig.use_static) {
      Immutable.static = immutableInit({
          use_static: true
      });
  }

  Object.freeze(Immutable);

  return Immutable;
}

  var Immutable = immutableInit();
  /* istanbul ignore if */
  if (typeof undefined === 'function' && undefined.amd) {
    undefined(function() {
      return Immutable;
    });
  } else {
    module.exports = Immutable;
  }
})();
});
var seamlessImmutable_development_1 = seamlessImmutable_development.static;
var seamlessImmutable_development_2 = seamlessImmutable_development.Immutable;

var defaultState = seamlessImmutable_development_1.from({
  data: undefined,
  error: null,
  isRequesting: false,
  isErrored: false
});

var defaultErrorKey = 'error';

function makeReducer(entityType, options) {
  var hooks = {
    start: function start(nextState, _prevState, _action, _options) {
      return nextState;
    },
    success: function success(nextState, _state, _action, _options) {
      return nextState;
    },
    error: function error(nextState, _state, _action, _options) {
      return nextState;
    },
    all: function all(nextState, _state, _action, _options) {
      return nextState;
    },
    default: function _default(state, _action, _options) {
      return state;
    }
  };

  var errorKey = options && options.errorKey || defaultErrorKey;

  var initialState = errorKey === defaultErrorKey ? defaultState : initialState = seamlessImmutable_development_1.from(_extends({}, seamlessImmutable_development_1.without(defaultState, 'error'), defineProperty({}, errorKey, null)));

  var reducer = function reducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    var nextState = void 0;
    switch (action.type) {
      case entityType + '.start':
        nextState = _extends({}, state, defineProperty({
          isRequesting: true,
          isErrored: false
        }, errorKey, null));

        nextState = hooks.start(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return seamlessImmutable_development_1.from(nextState);

      case entityType + '.success':
        nextState = _extends({}, state, {
          data: action.payload,
          isRequesting: false,
          isErrored: false
        });

        nextState = hooks.success(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return seamlessImmutable_development_1.from(nextState);

      case entityType + '.error':
        nextState = _extends({}, state, defineProperty({
          isRequesting: false,
          isErrored: true
        }, errorKey, action.payload));

        nextState = hooks.error(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return seamlessImmutable_development_1.from(nextState);

      case entityType + '.set':
        // Restrict the change to the data property
        var path = ['data'];
        if (action.meta.path) {
          path = path.concat(action.meta.path);
        }
        return seamlessImmutable_development_1.setIn(state, path, action.payload);

      case 'grim.reset':
        var _action$payload = action.payload,
            includes = _action$payload.includes,
            excludes = _action$payload.excludes;

        if (includes) {
          if (includes.includes(entityType)) {
            return initialState;
          }
        } else if (!excludes || !excludes.includes(entityType)) {
          return initialState;
        }

      default:
        nextState = hooks.default ? hooks.default(state, action, options) : nextState;
        return seamlessImmutable_development_1.from(nextState);
    }
  };

  addHooks(reducer, hooks);
  reducer.modifyInitialState = function (fn) {
    return initialState = fn(initialState), reducer;
  };

  return reducer;
}

function setAction(entityType, payload, path) {
  return {
    type: entityType + '.set',
    payload: payload,
    meta: {
      entityType: entityType,
      path: path
    }
  };
}

function resetAction() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      includes = _ref.includes,
      excludes = _ref.excludes;

  return {
    type: 'grim.reset',
    payload: {
      excludes: excludes,
      includes: includes
    }
  };
}

var defaultId = 'id';
var idProp = 'idProp';
var targetProp = 'to';
var propertiesProp = 'nestedProps';

// If the rule has an alias, chain through all the rules to find the base rule.
function resolveRule(rules, type) {
  var rule = rules[type];
  var entityType = rule && type;

  while (rule && rule[targetProp]) {
    if (rule[idProp] || rule[propertiesProp]) {
      throw '\'' + targetProp + '\' aliases cannot be used with \'' + idProp + '\' and \'' + propertiesProp + '\' properties';
    }
    entityType = rule[targetProp];
    rule = rules[rule[targetProp]];
  }

  return { entityType: entityType, rule: rule };
}

/**
 * @param {Object} rules - object specifying how entities are
 *   normalized
 * @param {id | Array[id] | object} id - Item or items to be denormalised
 * @oaram {String} entityType - key indicating the type of the normalized id/ids
 * @param {Object} state - The part of the state tree mapping from
 *   entityType => id => to the  entity data
 *
 * @return Denormalized object, or the original id parameter unchanged.
 */
function denormalize(rules, entityType, id, state) {
  if (!id) return id;

  var _resolveRule = resolveRule(rules, entityType),
      rule = _resolveRule.rule,
      type = _resolveRule.entityType;

  if (Array.isArray(id)) {
    return id.map(function (id) {
      return denormalize(rules, type, id, state);
    });
  }

  // Denormalize an object - treat it as a map and denormalize the values
  if ((typeof id === 'undefined' ? 'undefined' : _typeof(id)) === 'object') {
    return Object.entries(id).reduce(function (obj, _ref) {
      var _ref2 = slicedToArray(_ref, 2),
          prop = _ref2[0],
          id = _ref2[1];

      obj[prop] = denormalize(rules, type, id, state);
      return obj;
    }, {});
  }

  var stateEntity = state[type] && state[type][id];

  // The entity data may not exist in the state (it may be fetched by a separate
  // endpoint) in which case just return the id.
  if (!stateEntity) return id;

  var entity = _extends({}, stateEntity);

  // Denormalize any child properties specified by the rule
  if (rule[propertiesProp]) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(rule[propertiesProp])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref3 = _step.value;

        var _ref4 = slicedToArray(_ref3, 2);

        var prop = _ref4[0];
        var _type = _ref4[1];

        entity[prop] = denormalize(rules, _type, entity[prop], state);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return entity;
}

var _configSchema;

// Very simple schema parsing, using typeof types.
// propName: 'string' - propName must be defined and of type 'string'.
// propName: 'number?' - propName may be undefined or have type number
// propName: 'string{}' - propName must be defined, and is an object, every
//   property of which must be a 'string'
// propName: 'number{}?' - propName may be undefined or must be an object
//   every property of which must be a 'number'
var configSchema = (_configSchema = {
  entityType: 'string'
}, defineProperty(_configSchema, idProp, 'string?'), defineProperty(_configSchema, targetProp, 'string?'), defineProperty(_configSchema, propertiesProp, 'string{}?'), _configSchema);

// Used to split the schema descriptions.
// E.g. 'abc{}?'.split(/(\{\})?(\??)$/) -> ["abc", "{}", "?", ""];
var schemaRE = /(\{\})?(\??)$/;

// Verifies that every member of an array matches the specified schema, see
// above.
var verifySchema = function verifySchema(arr, schema) {
  return arr.every(function (obj) {
    var keys = new Set([].concat(toConsumableArray(Object.keys(configSchema)), toConsumableArray(Object.keys(obj))));
    return Array.from(keys).every(function (propName) {
      var schemaValue = schema[propName];
      if (schemaValue === undefined) return;

      var _schemaValue$split = schemaValue.split(schemaRE),
          _schemaValue$split2 = toArray(_schemaValue$split),
          schemaType = _schemaValue$split2[0],
          rest = _schemaValue$split2.slice(1);

      var isOptional = rest.indexOf('?') > -1;
      var isObject = rest.indexOf('{}') > -1;

      var objValue = obj[propName];
      var objType = typeof objValue === 'undefined' ? 'undefined' : _typeof(objValue);

      if (isOptional && objValue === undefined) return true;

      if (isObject) {
        return objType === 'object' && Object.values(objValue).every(function (val) {
          return (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === schemaType;
        });
      }

      return objValue !== undefined && (typeof objType === 'undefined' ? 'undefined' : _typeof(objType)) === schemaType;
    });
  });
};

var cachedRules = void 0;
var previousRules = void 0;
var previousLength = void 0;

function processRules(rules) {
  if (cachedRules && rules === previousRules && rules.length === previousLength) {
    return cachedRules;
  }

  if (!verifySchema(rules, configSchema)) {
    throw 'Error: rules do not match schema';
  }

  cachedRules = rules.reduce(function (o, rule) {
    return o[rule.entityType] = rule, o;
  }, {});
  previousRules = rules;
  previousLength = rules.length;
  return cachedRules;
}

/**
 * Test if two arrays are the same, or contain the same contents
 */
function arrayEquals(arr1, arr2) {
  return arr1 === arr2 || arr1 && arr2 && arr1.length === arr2.length && arr1.every(function (item, ii) {
    return item === arr2[ii];
  });
}

/**
 * Build an array of all dependant entity types.
 * Note: This doesn't handle cyclic dependencies. Please don't introduce any.
 */
function getEntityTypes(rules, type) {
  var _resolveRule = resolveRule(rules, type),
      rule = _resolveRule.rule,
      entityType = _resolveRule.entityType;

  var entityTypes = entityType && [entityType];
  if (rule && rule[propertiesProp]) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.values(rule[propertiesProp])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        entityTypes = [].concat(toConsumableArray(entityTypes), toConsumableArray(getEntityTypes(rules, key)));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
  return entityTypes;
}

/**
 * Creates a memoized selector which returns denormalized objects.
 *
 * @param rules {object} optional - Describes how objects are normalized
 * @param entitiesSelector {function} - selector function which takes the state
 *   and returns the part of the state tree where normalized entity data lives.
 * @param entityType {string} - the type of the entity being selected
 * @param selector {function} - selector function. See below.
 * @returns a memoized selector function which returns denormalized entities.
 *
 * The selector parameter is a function which takes the state and resolves to
 * one of three types:
 * 1. an id.
 *    The entity selector returns the object corresponding to the id
 * 2. an array of ids
 *    The entity selector returns array of objects corresponding to the array of
 *    ids
 * 3. an object whose properties map to ids
 *    The entity selector returns an object whose properties map to the
 *    corresponding objects.
 *
 * Note: The selector parameter function can return either the id directly
 * or an object with a data property (because we use the format {
 *   data: id,
 *   isRequesting: true
 *   errors: [...]
 * }) where the value of the data property is the id, array of ids etc
 */
function createSelector(arrayRules, entitiesSelector, entityType, selector) {
  var rules = processRules(arrayRules);
  if (!rules[entityType]) throw 'Key not found ' + entityType;
  var keys = [].concat(toConsumableArray(new Set(getEntityTypes(rules, entityType))));

  var selectors = [
  // Only create a dependency on the normalized id (the data property of the
  // object in the store for most cases).
  function (state) {
    var selection = selector(state);
    var isObject = selection && (typeof selection === 'undefined' ? 'undefined' : _typeof(selection)) === 'object';

    // This was a bad design decision. It's the only direct link with how
    // objects are stored with Grim. Ideally the selector passed should
    // point to the data property directly.
    return isObject && 'data' in selection ? selection.data : selection;
  }].concat(toConsumableArray(keys.map(function (key) {
    return function (state) {
      return entitiesSelector(state)[key];
    };
  })));

  var lastSelected = void 0;
  var lastDenormalized = void 0;

  return function (state) {
    var selected = selectors.map(function (selector) {
      return selector(state);
    });
    if (!arrayEquals(selected, lastSelected)) {
      lastSelected = selected;
      lastDenormalized = seamlessImmutable_development_1.from(denormalize(rules, entityType, selected[0], entitiesSelector(state)));
    }
    return lastDenormalized;
  };
}

// Updates entities in response to any action with response.entities.
// Depends on the normalizerMiddelware
function normalizationReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _ref = arguments[1];
  var meta = _ref.meta;

  if (meta && meta.method === 'delete' && meta.id) {
    // Only a single item can be deleted at a time.
    return seamlessImmutable_development_1.set(state, meta.entityType, seamlessImmutable_development_1.without(state[meta.entityType], meta.id));
  } else if (meta && meta.entities && _typeof(meta.entities) === 'object') {
    // Using seamless-immutable's deep merge resulted in an issue where an
    // entity was supposed to have had a set of associated objects removed
    // by setting the property to an empty object, but the deep merge retained
    // those objects.
    // Instead each entity type is merged separately using a shallow merge,
    // which effectively replaces rather than merges individual entities.
    var nextState = state;
    Object.keys(meta.entities).forEach(function (entityType) {
      return nextState = seamlessImmutable_development_1.set(nextState, entityType, seamlessImmutable_development_1.merge({}, [state[entityType], meta.entities[entityType]]));
    });
    return nextState;
  }
  return state;
}

/**
 * @param {Object} rules - object specifying how entities are
 *   normalized
 * @oaram {String} entityType - the type of the object
 * @param {Object | Array} obj - The object, or array of objects to normalize.
 *  If the object has no id, it's assumed that all the properties of the object
 *  are the objects (of the same type), to normalize.
 * @param {Object} state - an object which will be populated with properties
 *   mapping from entityType => ids => object
 *
 * @return {number | Array | Object } - an id, or array of ids, or an object
 *  whose properties map to ids.
 */
function normalize(rules, entityType, obj, state) {
  if (!rules[entityType]) throw 'Unrecognised entityType: ' + entityType;

  var _resolveRule = resolveRule(rules, entityType),
      rule = _resolveRule.rule,
      type = _resolveRule.entityType;

  if (Array.isArray(obj)) {
    return obj.map(function (item) {
      return normalize(rules, type, item, state);
    });
  }

  if (!obj || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
    return obj;
  }

  var idProp$$1 = rule[idProp] || defaultId;
  var id = obj[idProp$$1];

  if (!id) {
    return Object.entries(obj).reduce(function (o, _ref) {
      var _ref2 = slicedToArray(_ref, 2),
          prop = _ref2[0],
          item = _ref2[1];

      o[prop] = normalize(rules, type, item, state);
      return o;
    }, {});
  }

  var entity = _extends({}, obj);
  state[type] = state[type] || {};
  state[type][id] = entity;

  if (rule[propertiesProp]) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(rule[propertiesProp])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref3 = _step.value;

        var _ref4 = slicedToArray(_ref3, 2);

        var prop = _ref4[0];
        var _type = _ref4[1];

        entity[prop] = normalize(rules, _type, obj[prop], state);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return id;
}

/**
 * Create Redux middleware function which normalizes entities
 */
function getNormalizerMiddleware(arrayRules, callback) {
  var rules = processRules(arrayRules);
  return function () {
    return function (next) {
      return function (action) {
        // entityType is added by autogenerated actions. Normalization only applies
        // to autogenerated components.
        var payload = action.payload,
            meta = action.meta;

        var entityType = meta && meta.entityType;
        if (entityType && payload && rules[entityType]) {
          meta.entities = {};
          action.payload = normalize(rules, entityType, payload, meta.entities);
          callback && callback(entityType, payload);
        }
        return next(action);
      };
    };
  };
}

exports.makeActionCreator = makeActionCreator;
exports.makeReducer = makeReducer;
exports.setAction = setAction;
exports.resetAction = resetAction;
exports.createSelector = createSelector;
exports.normalizationReducer = normalizationReducer;
exports.getNormalizerMiddleware = getNormalizerMiddleware;
exports.processRules = processRules;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=redux-grim.js.map
