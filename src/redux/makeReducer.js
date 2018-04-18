import { static as Immutable } from 'seamless-immutable';
import addHooks from './addHooks';

const defaultState = Immutable.from({
  data: undefined,
  error: null,
  isRequesting: false,
  isErrored: false
});

export default function makeReducer(entityType, options) {
  const hooks = {
    start: (nextState, _prevState, _action, _options) => nextState,
    success: (nextState, _state, _action, _options) => nextState,
    error: (nextState, _state, _action, _options) => nextState,
    default: (state, _action, _options) => state
  };

  let initialState = defaultState;

  const reducer = (state = initialState, action) => {
    let nextState;
    switch (action.type) {
      case `${entityType}.start`:
        nextState = {
          ...state,
          isRequesting: true,
          isErrored: false,
          error: null
        };

        return Immutable.from(hooks.start(nextState, state, action, options));

      case `${entityType}.success`:
        nextState = {
          ...state,
          data: action.payload,
          isRequesting: false,
          isErrored: false
        };

        return Immutable.from(hooks.success(nextState, state, action, options));

      case `${entityType}.error`:
        nextState = {
          ...state,
          isRequesting: false,
          isErrored: true,
          error: action.payload
        };

        return Immutable.from(hooks.error(nextState, state, action, options));

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
