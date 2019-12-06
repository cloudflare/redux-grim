import reducer from '../normalizationReducer';

describe('reducer', () => {
  let initialState;
  beforeEach(
    () =>
      (initialState = {
        oranges: {
          '1': { flavour: 'zesty!' },
          '2': { flavour: 'sweet' }
        },
        apples: {
          '1': { flavour: 'apple-ish' },
          '2': { flavour: 'it tastes of despair' }
        }
      })
  );

  test('should delete entities', () => {
    const newState = reducer(initialState, {
      meta: {
        entityType: 'oranges',
        id: '1',
        method: 'delete'
      }
    });

    expect(newState).toEqual({
      oranges: {
        '2': { flavour: 'sweet' }
      },
      apples: {
        '1': { flavour: 'apple-ish' },
        '2': { flavour: 'it tastes of despair' }
      }
    });
  });

  test('should ignore delete when entity type does not exist', () => {
    const newState = reducer(initialState, {
      meta: {
        entityType: 'banana',
        id: '1',
        method: 'delete'
      }
    });

    expect(newState).toEqual(initialState);
  });

  test('should merge entities starting with an empty state', () => {
    const entities = {
      bananas: {
        '1': { flavour: 'squidgy' },
        '2': { flavour: 'isoamyl acetate-ish' }
      },
      pajamas: {
        '1': { flavour: 'cotton-ish' }
      }
    };

    const newState = reducer(undefined, { meta: { entities } });
    expect(newState).toEqual(entities);
  });

  test('should merge entities starting with an initial state', () => {
    const entities = {
      bananas: {
        '1': { flavour: 'squidgy' },
        '2': { flavour: 'isoamyl acetate-ish' }
      },
      pajamas: {
        '1': { flavour: 'cotton-ish' }
      },
      oranges: {
        '3': { flavour: 'like a satsuma, but bigger' }
      }
    };

    const newState = reducer(initialState, { meta: { entities } });
    expect(newState).toEqual({
      oranges: {
        '1': { flavour: 'zesty!' },
        '2': { flavour: 'sweet' },
        '3': { flavour: 'like a satsuma, but bigger' }
      },
      apples: {
        '1': { flavour: 'apple-ish' },
        '2': { flavour: 'it tastes of despair' }
      },
      bananas: {
        '1': { flavour: 'squidgy' },
        '2': { flavour: 'isoamyl acetate-ish' }
      },
      pajamas: {
        '1': { flavour: 'cotton-ish' }
      }
    });
  });

  test('should not deep merge entities', () => {
    const entities = {
      oranges: {
        '1': { texture: 'crunchy' }
      }
    };

    const newState = reducer(initialState, { meta: { entities } });
    expect(newState).toEqual({
      oranges: {
        '1': { texture: 'crunchy' },
        '2': { flavour: 'sweet' }
      },
      apples: {
        '1': { flavour: 'apple-ish' },
        '2': { flavour: 'it tastes of despair' }
      }
    });
  });
});
