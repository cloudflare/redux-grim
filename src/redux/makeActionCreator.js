import addHooks from './addHooks';
import { getStartType, getSuccessType, getErrorType } from '../util';

const bodyMethods = ['put', 'patch', 'post'];

// Regex to match the contents of () brackets
const parensReg = /\(([^)]+)\)/g; //

// Regex to match the contents of [] brackets
const squareParensReg = /\[([^)]+)\]/g;

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
const defaultHooks = {
  start: (action, _namedParams, _restArgs, _options) => action,
  success: (action, _namedParams, _restArgs, _options) => action,
  error: (action, _namedParams, _restArgs, _options) => action,
  // All applies to start, success, and error actions
  all: (action, _namedParams, _restArgs, _options) => action
};

// Some default behaviours when creating actions, that can be overridden.
// apiFetch allows the fetch behaviour to be modified. restArgs - the parameters
//  that were passed to the action after those specified by the url, are also
//  passed to this function.
const defaultFunctions = {
  apiFetch: (method, url, body, ..._rest) =>
    // eslint-disable-next-line compat/compat
    fetch(url, {
      method: method.toUpperCase(),
      body: JSON.stringify(body)
    })
};

/**
 * Return true if the api and action functions require an object parameter
 * @param {String} method
 * @param {String} templateUrl
 * @returns boolean
 */
function hasBodyParam(method, templateUrl) {
  return (
    bodyMethods.includes(method) ||
    (method === 'delete' && templateUrl.includes('['))
  );
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
export function getNamedParameters(method, templateUrl) {
  const params = new Set();
  let match;
  while ((match = parensReg.exec(templateUrl))) {
    // Urls can reference the same object multiple times.
    // E.g. /(zone.id)/(zone.organization.id)
    // This will only add one named parameter to the array ('zone')
    const str = match[1];
    const periodIndex = str.indexOf('.');
    params.add(periodIndex === -1 ? str : str.substr(0, str.indexOf('.')));
  }
  if (hasBodyParam(method, templateUrl)) {
    params.add('body');
  }
  return params.size ? [...params] : [];
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
export function makeUrlEvaluator(templateUrl) {
  let url = templateUrl
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
export function makeGetApiData(templateUrl, namedParams) {
  const urlEvaluator = makeUrlEvaluator(templateUrl);

  return (...args) => {
    const params = namedParams.reduce((o, param, ii) => {
      o[param] = args[ii];
      return o;
    }, {});

    return {
      url: urlEvaluator(params),
      params,
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
export default function makeActionCreator(
  entityType,
  method,
  templateUrl,
  options = {}
) {
  const namedParams = getNamedParameters(method, templateUrl);
  options.debug &&
    logActionCreation(entityType, method, templateUrl, namedParams);

  let mock;
  const hooks = { ...defaultHooks };
  const functions = { ...defaultFunctions };
  const getApiData = makeGetApiData(templateUrl, namedParams);

  const action = (...args) => async dispatch => {
    if (options.debug) {
      validateActionParameters(
        entityType,
        method,
        templateUrl,
        args,
        namedParams
      );
    }

    const { url, params, restArgs } = getApiData(...args);
    let startAction = {
      type: getStartType(entityType),
      meta: {
        entityType,
        method
      }
    };
    startAction = hooks.start(startAction, params, restArgs, options);
    startAction = hooks.all(startAction, params, restArgs, options);
    dispatch(startAction);

    try {
      let mockValue, response;
      if (mock !== undefined) {
        mockValue = typeof mock === 'function' ? mock(...args) : mock;
        response = mockValue === undefined ? undefined : { body: mockValue };
        response && console.info(`Mocking ${method} ${templateUrl}`, mockValue);
      }
      response =
        response ||
        (await functions.apiFetch(method, url, params.body, ...restArgs));

      let successAction = {
        type: getSuccessType(entityType),
        payload: response && response.body,
        meta: {
          entityType,
          method
        }
      };

      successAction = hooks.success(
        successAction,
        params,
        restArgs,
        options,
        response
      );

      successAction = hooks.all(
        successAction,
        params,
        restArgs,
        options,
        response
      );

      const result = successAction.payload;
      dispatch(successAction);
      return result;
    } catch (error) {
      let errorAction = {
        type: getErrorType(entityType),
        payload: error,
        error: true,
        meta: {
          entityType,
          method
        }
      };
      errorAction = hooks.error(errorAction, params, restArgs, options, error);
      errorAction = hooks.all(errorAction, params, restArgs, options, error);
      dispatch(errorAction);
      throw error;
    }
  };

  // All these functions return the action so they can be chained.
  addHooks(action, hooks);
  action.apiFetch = fn => ((functions.apiFetch = fn), action);
  action.mock = fn => ((mock = fn), action);
  action.unmock = () => ((mock = undefined), action);
  return action;
}

/**
 * Called automatically when options = { debug: true }, to log information
 * about action creation.
 */
export function logActionCreation(entityType, method, url, namedParams) {
  console.log(
    `Created action ${entityType}, ${url}, ${method}(${namedParams.join(', ')})`
  );
}

/**
 * Called automatically when options = { debug: true } to warn when there's
 * mismatch between the expected parameters of an action and what's actually
 * created.
 */
export function validateActionParameters(
  entityType,
  method,
  url,
  args,
  namedParams
) {
  const hasBody =
    url.indexOf('[') > -1 || ['post', 'put', 'patch'].includes(method);

  // All parameters should be strings or numbers, unless there's a body, in
  // which case the last parameter is an object.
  if (args.length < namedParams.length) {
    console.warn(
      `For api call ${entityType}, ${method}, ${url},
         Expected parameters: ${namedParams.join(', ')}
         Actual parameters: ${args.join(', ')}
      `
    );
  }
  namedParams.forEach((param, ii) => {
    const type = typeof args[ii];
    if (hasBody && ii === namedParams.length - 1) {
      if (type !== 'object') {
        console.warn(
          `${entityType}, ${method}, ${url}: Expected parameter ${
            param
          } to be an object. Actual value: ${args[ii]} ${type}`
        );
      }
    } else if (type !== 'string' && type !== 'number') {
      console.warn(
        `${entityType}, ${method}, ${url}: Expected parameter ${
          param
        } to be a string or number. Actual value: ${args[ii]}`
      );
    }
  });
}
