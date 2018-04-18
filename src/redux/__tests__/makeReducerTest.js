import makeReducer from '../makeReducer';

const reducer = makeReducer('items');

describe('makeReducer', () => {
  test('should return an initial state', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual({
      data: undefined,
      error: null,
      isRequesting: false,
      isErrored: false
    });
  });

  test('should modify the initial state', () => {
    const reducer = makeReducer('items').modifyInitialState(state => ({
      ...state,
      messages: []
    }));
    const state = reducer(undefined, {});
    expect(state).toEqual({
      data: undefined,
      error: null,
      isRequesting: false,
      isErrored: false,
      messages: []
    });
  });

  test('should return the same state when passed an action of unknown type', () => {
    const state = reducer(undefined, {});
    const action = { type: 'unknown', entityType: 'unknown' };
    const nextState = reducer(state, action);
    expect(state).toBe(nextState);
  });

  test('should process a start action', () => {
    const initialState = { test: 1 };
    const action = { type: 'items.start', meta: { entityType: 'items' } };
    const state = reducer(initialState, action);
    expect(state).not.toBe(initialState);
    expect(state).toEqual({
      test: 1,
      isRequesting: true,
      isErrored: false,
      error: null
    });
  });

  test('should process a success action', () => {
    const initialState = { test: 1 };
    const action = {
      type: 'items.success',
      payload: 'result',
      meta: {
        entityType: 'items'
      }
    };
    const state = reducer(initialState, action);

    expect(state).not.toBe(initialState);
    expect(state).toEqual({
      test: 1,
      data: 'result',
      isRequesting: false,
      isErrored: false
    });
  });

  test('should process an error action', () => {
    const initialState = { test: 1 };
    const action = {
      type: 'items.error',
      payload: 'errors',
      error: true,
      meta: {
        entityType: 'items'
      }
    };
    const state = reducer(initialState, action);
    expect(state).not.toBe(initialState);
    expect(state).toEqual({
      test: 1,
      error: 'errors',
      isRequesting: false,
      isErrored: true
    });
  });

  describe('setAction', () => {
    test('should process a set action', () => {
      const action = {
        type: 'items.set',
        payload: 'result',
        meta: {
          entityType: 'items'
        }
      };
      const state = reducer(undefined, action);
      expect(state).toEqual({
        data: 'result',
        isRequesting: false,
        isErrored: false,
        error: null
      });
    });

    test('should set a nested value action', () => {
      const action = {
        type: 'items.set',
        payload: 'tasty',
        meta: {
          entityType: 'items',
          path: ['fruit', 'banana']
        }
      };
      const state = reducer(
        {
          data: {
            fruit: {
              banana: 'not tasty'
            }
          }
        },
        action
      );
      expect(state).toEqual({
        data: {
          fruit: {
            banana: 'tasty'
          }
        }
      });
    });
  });

  describe('reset', () => {
    test('should reset without includes or excludes', () => {
      const initialState = reducer(undefined, {});
      const state = reducer({ test: 1 }, {});
      const action = { type: 'grim.reset', payload: {} };
      const nextState = reducer(state, action);
      expect(nextState).toBe(initialState);
    });

    test('should reset with include', () => {
      const initialState = reducer(undefined, {});
      const state = reducer({ test: 1 }, {});
      const action = { type: 'grim.reset', payload: { includes: ['items'] } };
      const nextState = reducer(state, action);
      expect(nextState).toBe(initialState);
    });

    test('should not reset with include of a different key', () => {
      const state = reducer({ test: 1 }, {});
      const action = { type: 'grim.reset', payload: { includes: ['other'] } };
      const nextState = reducer(state, action);
      expect(nextState).toBe(state);
    });

    test('should not reset with exclude', () => {
      const state = reducer({ test: 1 }, {});
      const action = { type: 'grim.reset', payload: { excludes: ['items'] } };
      const nextState = reducer(state, action);
      expect(nextState).toBe(state);
    });

    test('should reset with exclude of a different key', () => {
      const initialState = reducer(undefined, {});
      const state = reducer({ test: 1 }, {});
      const action = { type: 'grim.reset', payload: { excludes: ['other'] } };
      const nextState = reducer(state, action);
      expect(nextState).toBe(initialState);
    });
  });
});
