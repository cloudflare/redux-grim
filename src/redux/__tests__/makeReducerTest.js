import makeReducer from '../makeReducer';

const reducer = makeReducer('items');
const defaultState = {
  data: undefined,
  error: null,
  isRequesting: false,
  isErrored: false
};

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

  describe('hooks', () => {
    test('should call start hook', () => {
      let count = 0;

      const options = {};
      const action = { type: 'items.start' };
      const reducer = makeReducer('items', options).on(
        'start',
        (nextState, prevState, hookAction, hookOptions) => {
          count++;
          expect(nextState).toEqual({
            data: undefined,
            isRequesting: true,
            isErrored: false,
            error: null
          });
          expect(prevState).toEqual(defaultState);
          expect(hookAction).toBe(action);
          expect(hookOptions).toBe(options);
        }
      );

      reducer(undefined, action);
      expect(count).toBe(1);
    });

    test('should call success hook', () => {
      let count = 0;

      const options = {};
      const action = { type: 'items.success', payload: 1 };
      const reducer = makeReducer('items', options).on(
        'success',
        (nextState, prevState, hookAction, hookOptions) => {
          count++;
          expect(nextState).toEqual({
            data: 1,
            isRequesting: false,
            isErrored: false,
            error: null
          });
          expect(prevState).toEqual(defaultState);
          expect(hookAction).toBe(action);
          expect(hookOptions).toBe(options);
        }
      );

      reducer(undefined, action);
      expect(count).toBe(1);
    });

    test('should call error hook', () => {
      let count = 0;

      const options = {};
      const action = { type: 'items.error', payload: 1 };
      const reducer = makeReducer('items', options).on(
        'error',
        (nextState, prevState, hookAction, hookOptions) => {
          count++;
          expect(nextState).toEqual({
            data: undefined,
            isRequesting: false,
            isErrored: true,
            error: 1
          });
          expect(prevState).toEqual(defaultState);
          expect(hookAction).toBe(action);
          expect(hookOptions).toBe(options);
        }
      );

      reducer(undefined, action);
      expect(count).toBe(1);
    });

    test('should nest hooks and execute them in the correct order', () => {
      let count1 = 0;
      let count2 = 0;

      const action = { type: 'items.start' };
      const reducer = makeReducer('items')
        .on('start', () => {
          count1++;
          expect(count2).toBe(0);
        })
        .on('start', () => count2++);

      reducer(undefined, action);
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    test('should call default hook if a known action is not processed', () => {
      let count = 0;

      const action = { type: 'unknown.action' };
      const reducer = makeReducer('items').on('default', () => count++);

      reducer(undefined, action);
      expect(count).toBe(1);
    });

    test('should not call default hook if a known action is processed', () => {
      let count = 0;

      const action = { type: 'items.start' };
      const reducer = makeReducer('items').on('default', () => count++);

      reducer(undefined, action);
      expect(count).toBe(0);
    });

    test('should call all hook for start, success, and error actions', () => {
      let count = 0;

      const reducer = makeReducer('items').on('all', () => count++);

      reducer(undefined, { type: 'items.start' });
      reducer(undefined, { type: 'items.error' });
      reducer(undefined, { type: 'items.success' });

      expect(count).toBe(3);
    });

    test('should not call all hook for default, set, or reset actions', () => {
      let count = 0;

      const reducer = makeReducer('items').on('all', () => count++);

      reducer(undefined, { type: 'unknown.action' });
      reducer(undefined, { type: 'items.set', meta: {} });
      reducer(undefined, { type: 'grim.reset', payload: {} });

      expect(count).toBe(0);
    });
  });

  describe('keys', () => {
    const reducer = makeReducer('items', {
      errorKey: 'myError',
      dataKey: 'myData',
      isRequestingKey: 'myIsRequesting',
      isErroredKey: 'myIsErrored'
    });

    test('should create an initial state with an overriden keys', () => {
      const state = reducer(undefined, {});
      expect(state).toEqual({
        myData: undefined,
        myError: null,
        myIsRequesting: false,
        myIsErrored: false
      });
    });

    test('should should update overridden keys on a start action', () => {
      const state = reducer(
        {
          myData: undefined,
          myError: 'error',
          myIsRequesting: false,
          myIsErrored: false
        },
        { type: 'items.start' }
      );
      expect(state).toEqual({
        myData: undefined,
        myError: null,
        myIsRequesting: true,
        myIsErrored: false
      });
    });

    test('should should update overridden keys on a error action', () => {
      const state = reducer(
        {
          myData: undefined,
          myError: null,
          myIsRequesting: false,
          myIsErrored: false
        },
        { type: 'items.error', payload: 'error' }
      );
      expect(state).toEqual({
        myData: undefined,
        myError: 'error',
        myIsRequesting: false,
        myIsErrored: true
      });
    });

    test('should update overridden keys on a success action', () => {
      const state = reducer(
        {
          myData: undefined,
          myError: 'success',
          myIsRequesting: false,
          myIsErrored: false
        },
        { type: 'items.success', payload: 1 }
      );
      expect(state).toEqual({
        myData: 1,
        myError: 'success',
        myIsRequesting: false,
        myIsErrored: false
      });
    });
  });
});
