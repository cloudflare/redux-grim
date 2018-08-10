import { static as Immutable } from 'seamless-immutable';
import addHooks from './addHooks';
import { getStartType, getSuccessType, getErrorType } from '../util';

export const defaultState = Immutable.from({
  data: undefined,
  error: null,
  isRequesting: false,
  isErrored: false
});

const defaultErrorKey = 'error';

export default function makeReducer(entityType, options) {
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

  let errorKey = (options && options.errorKey) || defaultErrorKey;

  let initialState =
    errorKey === defaultErrorKey
      ? defaultState
      : Immutable.from({
          ...Immutable.without(defaultState, 'error'),
          [errorKey]: null
        });

  const reducer = (state = initialState, action) => {
    let nextState;
    switch (action.type) {
      case startType:
        nextState = {
          ...state,
          isRequesting: true,
          isErrored: false,
          [errorKey]: null
        };

        nextState = hooks.start(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return Immutable.from(nextState);

      case successType:
        nextState = {
          ...state,
          data: action.payload,
          isRequesting: false,
          isErrored: false
        };

        nextState = hooks.success(nextState, state, action, options);
        nextState = hooks.all(nextState, state, action, options);
        return Immutable.from(nextState);

      case errorType:
        nextState = {
          ...state,
          isRequesting: false,
          isErrored: true,
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
