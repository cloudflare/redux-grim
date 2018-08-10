import { static as Immutable } from 'seamless-immutable';
import addHooks from './addHooks';
import { getStartType, getSuccessType, getErrorType } from '../util';

export default function makeReducer(entityType, options = {}) {
  const hooks = {
    start: (nextState, _prevState, _action, _options) => nextState,
    success: (nextState, _state, _action, _options) => nextState,
    error: (nextState, _state, _action, _options) => nextState,
    all: (nextState, _state, _action, _options) => nextState,
    default: (state, _action, _options) => state
  };

  const startType = getStartType(entityType);
  const successType = getSuccessType(entityType);
  const errorType = getErrorType(entityType);

  const dataKey = options.dataKey || 'data';
  const errorKey = options.errorKey || 'error';
  const isRequestingKey = options.isRequestingKey || 'isRequesting';
  const isErroredKey = options.isErroredKey || 'isErrored';

  let initialState = Immutable.from({
    [dataKey]: undefined,
    [errorKey]: null,
    [isRequestingKey]: false,
    [isErroredKey]: false
  });

  const reducer = (state = initialState, action) => {
    let nextState;
    switch (action.type) {
      case startType:
        nextState = {
          ...state,
          [isRequestingKey]: true,
          [isErroredKey]: false,
          [errorKey]: null
        };

        nextState = hooks.start(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return Immutable.from(nextState);

      case successType:
        nextState = {
          ...state,
          [dataKey]: action.payload,
          [isRequestingKey]: false,
          [isErroredKey]: false
        };

        nextState = hooks.success(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return Immutable.from(nextState);

      case errorType:
        nextState = {
          ...state,
          [isRequestingKey]: false,
          [isErroredKey]: true,
          [errorKey]: action.payload
        };

        nextState = hooks.error(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return Immutable.from(nextState);

      case `${entityType}.set`:
        // Restrict the change to the data property
        let path = ['data'];
        if (action.meta.path) {
          path = path.concat(action.meta.path);
        }
        return Immutable.setIn(state, path, action.payload);

      case 'grim.reset':
        const { includes, excludes } = action.payload;
        if (includes) {
          if (includes.includes(entityType)) {
            return initialState;
          }
        } else if (!excludes || !excludes.includes(entityType)) {
          return initialState;
        }

      default:
        nextState = hooks.default
          ? hooks.default(state, action, options)
          : nextState;
        return Immutable.from(nextState);
    }
  };

  addHooks(reducer, hooks);
  reducer.modifyInitialState = fn => (
    (initialState = fn(initialState)), reducer
  );

  return reducer;
}
