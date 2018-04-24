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
export default function addHooks(target, hooks) {
  target.on = (hook, fn) => {
    if (!hook in hooks) throw `invalid hook ${hook}`;

    const previousHook = hooks[hook];
    if (previousHook) {
      hooks[hook] = (first, ...rest) =>
        fn(previousHook(first, ...rest), ...rest);
    } else {
      hooks[hook] = fn;
    }
    return target;
  };
}
