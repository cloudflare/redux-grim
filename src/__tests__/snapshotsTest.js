import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {
  makeActionCreator as makeAction,
  makeReducer,
  getNormalizerMiddleware,
  normalizationReducer,
  setAction
} from '..';

const itemKey = 'item';
const normalizedKey = 'normalized';
const normalizedToTargetKey = 'normalizedToTarget';
const normalizedIdKey = 'normalizedId';
const normalizedNestedPropsKey = 'normalizedNestedProps';

const itemBody = { id: 'x', value: itemKey };
const normalizedBody = { value: normalizedKey, id: 'a' };
const normalizedToTargetBody = { value: normalizedToTargetKey, id: 'b' };
const normalizedIdBody = { value: normalizedIdKey, otherId: 'c' };
const normalizedNestedPropsBody = {
  value: normalizedNestedPropsKey,
  id: 'd',
  normalized: {
    id: 'e',
    value: 'normalizedNested'
  }
};

const normalizerConfig = [
  {
    entityType: normalizedKey
  },
  {
    entityType: normalizedToTargetKey,
    to: normalizedKey
  },
  {
    entityType: normalizedIdKey,
    idProp: 'otherId'
  },
  {
    entityType: normalizedNestedPropsKey,
    nestedProps: {
      normalized: normalizedKey
    }
  }
];

const normalizer = getNormalizerMiddleware(normalizerConfig);

const makeTestAction = key =>
  makeAction(key, 'post', '/url/(param)/[id]', { option: 'actionOptions' })
    .on('start', (action, params, rest, options) => {
      action.onStart = { params, rest, options };
      return action;
    })
    .on('success', (action, params, rest, options, response) => {
      action.onSuccess = { params, rest, options, response };
      return action;
    })
    .on('error', (action, params, rest, options, response) => {
      action.onError = { params, rest, options, response };
      return action;
    })
    .on('all', (action, params, rest, options, response) => {
      action.onAll = { params, rest, options, response };
      return action;
    })
    .mock((param, body) => {
      if (param.startsWith('error')) {
        throw body;
      }
      return body;
    });

const makeTestReducer = key =>
  makeReducer(key, { options: 'reducerOptions' })
    .on('start', (nextState, _prevState, action, options) => {
      return {
        ...nextState,
        onStart: action.onStart,
        options
      };
    })
    .on('success', (nextState, _prevState, action, options) => {
      return {
        ...nextState,
        onSuccess: action.onSuccess,
        options
      };
    })
    .on('error', (nextState, _prevState, action, options) => {
      return {
        ...nextState,
        onError: action.onError,
        options
      };
    })
    .on('all', (nextState, _prevState, action, options) => {
      return {
        ...nextState,
        onAll: action.onAll,
        options
      };
    });

const itemAction = makeTestAction(itemKey);
const itemReducer = makeTestReducer(itemKey);

const normalizedAction = makeTestAction(normalizedKey);
const normalizedReducer = makeTestReducer(normalizedKey);

const normalizedToTargetAction = makeTestAction(normalizedToTargetKey);
const normalizedToTargetReducer = makeTestReducer(normalizedToTargetKey);

const normalizedIdAction = makeTestAction(normalizedIdKey);
const normalizedIdReducer = makeTestReducer(normalizedIdKey);

const normalizedNestedPropsAction = makeTestAction(normalizedNestedPropsKey);
const normalizedNestedPropsReducer = makeTestReducer(normalizedNestedPropsKey);

describe('GRiM Snapshots', () => {
  let store,
    dispatchedActions,
    getDispatch = {};

  beforeEach(() => {
    dispatchedActions = [];

    const recordActions = () => next => action => {
      dispatchedActions.push(action);
      return next(action);
    };

    store = createStore(
      combineReducers({
        entities: normalizationReducer,
        [itemKey]: itemReducer,
        [normalizedKey]: normalizedReducer,
        [normalizedToTargetKey]: normalizedToTargetReducer,
        [normalizedIdKey]: normalizedIdReducer,
        [normalizedNestedPropsKey]: normalizedNestedPropsReducer
      }),
      applyMiddleware(thunk, recordActions, normalizer)
    );
  });

  test('initial state', () => {
    expect(store.getState()).toMatchSnapshot();
  });

  test('state after success', () => {
    store.dispatch(
      itemAction('itemParam', itemBody, 'itemParam1', 'itemParam2')
    );

    store.dispatch(
      normalizedAction(
        'normalizedParam',
        normalizedBody,
        'normalizedParam1',
        'normalizedParam2'
      )
    );

    store.dispatch(
      normalizedToTargetAction(
        'normalizedToTargetParam',
        normalizedToTargetBody,
        'normalizedToTargetParam1',
        'normalizedToTargetParam2'
      )
    );

    store.dispatch(
      normalizedIdAction(
        'normalizedIdParam',
        normalizedIdBody,
        'normalizedIdParam1',
        'normalizedIdParam2'
      )
    );

    store.dispatch(
      normalizedNestedPropsAction(
        'normalizedNestedPropsParam',
        normalizedNestedPropsBody,
        'normalizedNestedPropsParam1',
        'normalizedNestedPropsParam2'
      )
    );

    expect(dispatchedActions).toMatchSnapshot();
    expect(store.getState()).toMatchSnapshot();
  });

  test('state after error', () => {
    try {
      store.dispatch(
        itemAction('errorItemParam', itemBody, 'itemParam1', 'itemParam2')
      );
    } catch (e) {}

    try {
      store.dispatch(
        normalizedAction(
          'errorNormalizedParam',
          normalizedBody,
          'normalizedParam1',
          'normalizedParam2'
        )
      );
    } catch (e) {}

    try {
      store.dispatch(
        normalizedToTargetAction(
          'errorNormalizedToTargetParam',
          normalizedToTargetBody,
          'normalizedToTargetParam1',
          'normalizedToTargetParam2'
        )
      );
    } catch (e) {}

    try {
      store.dispatch(
        normalizedIdAction(
          'errorNormalizedIdParam',
          normalizedIdBody,
          'normalizedIdParam1',
          'normalizedIdParam2'
        )
      );
    } catch (e) {}

    try {
      store.dispatch(
        normalizedNestedPropsAction(
          'errorNormalizedNestedPropsParam',
          normalizedNestedPropsBody,
          'normalizedNestedPropsParam1',
          'normalizedNestedPropsParam2'
        )
      );
    } catch (e) {}

    expect(dispatchedActions).toMatchSnapshot();
    expect(store.getState()).toMatchSnapshot();
  });

  test('state after set', () => {
    store.dispatch(setAction(itemKey, itemBody));
    store.dispatch(setAction(normalizedKey, normalizedBody));
    store.dispatch(setAction(normalizedToTargetKey, normalizedToTargetBody));
    store.dispatch(setAction(normalizedIdKey, normalizedIdBody));
    store.dispatch(
      setAction(normalizedNestedPropsKey, normalizedNestedPropsBody)
    );

    expect(dispatchedActions).toMatchSnapshot();
    expect(store.getState()).toMatchSnapshot();
  });
});
