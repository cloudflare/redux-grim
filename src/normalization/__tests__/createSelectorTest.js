import createSelector, { getEntityTypes } from '../createSelector';
import processRules from '../processRules';
import { static as Immutable } from 'seamless-immutable';
import { targetProp } from '../constants';

const entitiesSelector = state => state.entities;

describe('entitySelector', () => {
  // Rules describes how objects are normalized.
  const rules = [
    { entityType: 'item' },
    { entityType: 'items', [targetProp]: 'item' },
    { entityType: 'thing' },
    { entityType: 'thing2' },
    { entityType: 'things', [targetProp]: 'thing' },
    {
      entityType: 'nested',
      nestedProps: {
        item: 'item',
        things: 'things'
      }
    },
    {
      entityType: 'deeplyNested',
      nestedProps: {
        nested: 'nested',
        thing2: 'thing2'
      }
    }
  ];

  const objectRules = processRules(rules);

  describe('getEntityTypes', () => {
    test('should return nothing for an unrecognised rule', () => {
      const keys = getEntityTypes(objectRules, 'other');
      expect(keys).toBeUndefined();
    });

    test('should get the key for a normalised object', () => {
      const keys = getEntityTypes(objectRules, 'item');
      expect(keys).toEqual(['item']);
    });

    test('should get the key for an aliased object', () => {
      const keys = getEntityTypes(objectRules, 'items');
      expect(keys).toEqual(['item']);
    });

    test('should get the keys for a normalized object with nested normalized nestedProps', () => {
      const keys = getEntityTypes(objectRules, 'nested');
      expect(keys).toEqual(['nested', 'item', 'thing']);
    });

    test('should get ALL THE KEYS!', () => {
      const keys = getEntityTypes(objectRules, 'deeplyNested');
      expect(keys).toEqual([
        'deeplyNested',
        'nested',
        'item',
        'thing',
        'thing2'
      ]);
    });
  });

  describe('createSelector', () => {
    describe('for a normalized object', () => {
      const itemSelector = state => state.item;
      const itemEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'item',
        itemSelector
      );
      const state = {
        item: { data: 'a' },
        entities: {
          item: {
            a: { id: 'a', value: 'bar1' },
            b: { id: 'b', value: 'bar2' }
          }
        }
      };

      test('returns a single object', () => {
        const item = itemEntitySelector(state);
        expect(item).toEqual({
          id: 'a',
          value: 'bar1'
        });
      });

      test('returns the same object when the state does not change', () => {
        const item1 = itemEntitySelector(state);
        const item2 = itemEntitySelector(state);
        expect(item1).toBe(item2);
      });

      test('return a new object when object state changes', () => {
        const item1 = itemEntitySelector(state);
        const nextState = Immutable.setIn(state, ['item', 'data'], 'b');
        const item2 = itemEntitySelector(nextState);
        expect(item1).not.toBe(item2);
        expect(item2).toEqual({ id: 'b', value: 'bar2' });
      });

      test('returns the same object when an unrelated part of the state changes', () => {
        const item = itemEntitySelector(state);
        const nextState = Immutable.set(state, 'other', 'other');
        const item2 = itemEntitySelector(nextState);
        expect(item).toBe(item2);
      });

      test('returns a new object when an entity state of the same type changes', () => {
        const item = itemEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['entities', 'item', 'b', 'property'],
          'val'
        );
        const item2 = itemEntitySelector(nextState);
        expect(item).not.toBe(item2);
        expect(item).toEqual(item2);
      });

      test('returns a new object when the current entity state changes', () => {
        const item = itemEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['entities', 'item', 'a', 'prop'],
          1
        );
        const item2 = itemEntitySelector(nextState);
        expect(item).not.toEqual(item2);
        expect(item2).toEqual({
          id: 'a',
          value: 'bar1',
          prop: 1
        });
      });
    });

    describe('for an array of normalized objects', () => {
      const itemsSelector = state => state.items;
      const itemsEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'item',
        itemsSelector
      );
      const state = {
        items: { data: ['a', 'b', 'c'] },
        entities: {
          item: {
            a: { id: 'a', value: 'bar1' },
            b: { id: 'b', value: 'bar2' },
            c: { id: 'c', value: 'bar3' },
            d: { id: 'd', value: 'bar4' }
          }
        }
      };

      test('returns an array', () => {
        const items = itemsEntitySelector(state);
        expect(items).toEqual([
          { id: 'a', value: 'bar1' },
          { id: 'b', value: 'bar2' },
          { id: 'c', value: 'bar3' }
        ]);
      });

      test('returns the same array when the state does not change', () => {
        const items1 = itemsEntitySelector(state);
        const items2 = itemsEntitySelector(state);
        expect(items1).toBe(items2);
      });

      test('returns a new array when object state changes', () => {
        const items1 = itemsEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['items', 'data'],
          ['a', 'b', 'd']
        );
        const items2 = itemsEntitySelector(nextState);
        expect(items1).not.toBe(items2);
        expect(items2).toEqual([
          { id: 'a', value: 'bar1' },
          { id: 'b', value: 'bar2' },
          { id: 'd', value: 'bar4' }
        ]);
      });

      test('returns the same array when an unrelated part of the state changes', () => {
        const items1 = itemsEntitySelector(state);
        const nextState = Immutable.set(state, 'other', 'other');
        const items2 = itemsEntitySelector(nextState);
        expect(items1).toBe(items2);
      });

      test('returns a new array when entity state of the same type changes', () => {
        const items1 = itemsEntitySelector(state);
        const nextState = Immutable.setIn(state, ['entities', 'item', 'e'], {
          id: 'e',
          value: 'bar5'
        });
        const items2 = itemsEntitySelector(nextState);
        expect(items1).not.toBe(items2);
        expect(items1).toEqual(items2);
      });

      test('returns a new array when the current entity state changes', () => {
        const items1 = itemsEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['entities', 'item', 'c', 'property'],
          'val'
        );
        const items2 = itemsEntitySelector(nextState);
        expect(items1).not.toBe(items2);
        expect(items2).toEqual([
          { id: 'a', value: 'bar1' },
          { id: 'b', value: 'bar2' },
          { id: 'c', value: 'bar3', property: 'val' }
        ]);
      });
    });

    describe('for a normalized object with nested normalized nestedProps', () => {
      const nestedSelector = state => state.nested;
      const nestedEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'nested',
        nestedSelector
      );
      const state = {
        nested: { data: 'a' },
        entities: {
          nested: {
            a: {
              id: 'a',
              item: 'a',
              things: ['a', 'b'],
              value: 'nestedA'
            },
            b: {
              id: 'b',
              item: 'b',
              things: ['b', 'a'],
              value: 'nestedB'
            }
          },
          item: {
            a: { id: 'a', value: 'itemA' },
            b: { id: 'b', value: 'itemB' }
          },
          thing: {
            a: { id: 'a', value: 'thingA' },
            b: { id: 'b', value: 'thingB' }
          }
        }
      };

      test('returns an object', () => {
        const nested = nestedEntitySelector(state);
        expect(nested).toEqual({
          id: 'a',
          item: { id: 'a', value: 'itemA' },
          things: [{ id: 'a', value: 'thingA' }, { id: 'b', value: 'thingB' }],
          value: 'nestedA'
        });
      });

      test('returns the same object when the state does not change', () => {
        const nested1 = nestedEntitySelector(state);
        const nested2 = nestedEntitySelector(state);
        expect(nested1).toBe(nested2);
      });

      test('returns the same object when an unrelated part of the state changes', () => {
        const nested1 = nestedEntitySelector(state);
        const nextState = Immutable.set(state, 'other', 'other');
        const nested2 = nestedEntitySelector(nextState);
        expect(nested1).toBe(nested2);
      });

      test('returns a new object when nested object state changes', () => {
        const nested1 = nestedEntitySelector(state);
        const nextState = Immutable.setIn(state, ['nested', 'data'], 'b');
        const nested2 = nestedEntitySelector(nextState);
        expect(nested1).not.toBe(nested2);
        expect(nested2).toEqual({
          id: 'b',
          item: { id: 'b', value: 'itemB' },
          things: [{ id: 'b', value: 'thingB' }, { id: 'a', value: 'thingA' }],
          value: 'nestedB'
        });
      });

      test('returns a new object when nested entity state changes', () => {
        const nested1 = nestedEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['entities', 'thing', 'b', 'property'],
          'val'
        );
        const nested2 = nestedEntitySelector(nextState);
        expect(nested1).not.toBe(nested2);
        expect(nested2).toEqual({
          id: 'a',
          item: { id: 'a', value: 'itemA' },
          things: [
            { id: 'a', value: 'thingA' },
            { id: 'b', value: 'thingB', property: 'val' }
          ],
          value: 'nestedA'
        });
      });
    });

    describe('for a normalized object with deeply nested normalized nestedProps', () => {
      const deeplyNestedSelector = state => state.deeplyNested;
      const deeplyNestedEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'deeplyNested',
        deeplyNestedSelector
      );
      const state = {
        deeplyNested: { data: 'a' },
        entities: {
          deeplyNested: {
            a: {
              id: 'a',
              nested: 'a',
              thing2: 'a'
            }
          },
          nested: {
            a: {
              id: 'a',
              item: 'a',
              things: ['a', 'b'],
              value: 'nestedA'
            },
            b: {
              id: 'b',
              item: 'b',
              things: ['b', 'a'],
              value: 'nestedB'
            }
          },
          item: {
            a: { id: 'a', value: 'itemA' },
            b: { id: 'b', value: 'itemB' }
          },
          thing: {
            a: { id: 'a', value: 'thingA' },
            b: { id: 'b', value: 'thingB' }
          },
          thing2: {
            a: { id: 'a', value: 'thing2A' }
          }
        }
      };

      test('returns a deeply nested object', () => {
        const nested = deeplyNestedEntitySelector(state);
        expect(nested).toEqual({
          id: 'a',
          nested: {
            id: 'a',
            item: { id: 'a', value: 'itemA' },
            things: [
              { id: 'a', value: 'thingA' },
              { id: 'b', value: 'thingB' }
            ],
            value: 'nestedA'
          },
          thing2: { id: 'a', value: 'thing2A' }
        });
      });

      test('returns a new deeply nested object when nested entity state changes', () => {
        const nested1 = deeplyNestedEntitySelector(state);
        const nextState = Immutable.setIn(
          state,
          ['entities', 'thing', 'b', 'property'],
          'val'
        );
        const nested2 = deeplyNestedEntitySelector(nextState);
        expect(nested1).not.toBe(nested2);
        expect(nested2).toEqual({
          id: 'a',
          nested: {
            id: 'a',
            item: { id: 'a', value: 'itemA' },
            things: [
              { id: 'a', value: 'thingA' },
              { id: 'b', value: 'thingB', property: 'val' }
            ],
            value: 'nestedA'
          },
          thing2: { id: 'a', value: 'thing2A' }
        });
      });
    });
  });

  test('maps property values to objects', () => {
    const itemSelector = state => state.item;
    const itemEntitySelector = createSelector(
      rules,
      entitiesSelector,
      'item',
      itemSelector
    );
    const state = {
      item: {
        data: {
          x: 'a',
          y: 'b',
          z: 'c'
        }
      },
      entities: {
        item: {
          a: { id: 'a', value: 'bar1' },
          b: { id: 'b', value: 'bar2' },
          c: { id: 'C', value: 'bar3' }
        }
      }
    };

    const item = itemEntitySelector(state);
    expect(item).toEqual({
      x: { id: 'a', value: 'bar1' },
      y: { id: 'b', value: 'bar2' },
      z: { id: 'C', value: 'bar3' }
    });
  });

  describe('without a data property', () => {
    test('denormalizes an id', () => {
      const itemSelector = state => state.item;
      const itemEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'item',
        itemSelector
      );
      const state = {
        item: 'a',
        entities: {
          item: {
            a: { id: 'a', value: 'bar1' }
          }
        }
      };

      const item = itemEntitySelector(state);
      expect(item).toEqual({ id: 'a', value: 'bar1' });
    });

    test('denormalizes an array', () => {
      const itemSelector = state => state.item;
      const itemEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'item',
        itemSelector
      );
      const state = {
        item: ['a', 'b', 'c'],
        entities: {
          item: {
            a: { id: 'a', value: 'bar1' },
            b: { id: 'b', value: 'bar2' },
            c: { id: 'C', value: 'bar3' }
          }
        }
      };

      const item = itemEntitySelector(state);
      expect(item).toEqual([
        { id: 'a', value: 'bar1' },
        { id: 'b', value: 'bar2' },
        { id: 'C', value: 'bar3' }
      ]);
    });

    test('denormalizes an object', () => {
      const itemSelector = state => state.item;
      const itemEntitySelector = createSelector(
        rules,
        entitiesSelector,
        'item',
        itemSelector
      );
      const state = {
        item: {
          x: 'a',
          y: 'b',
          z: 'c'
        },
        entities: {
          item: {
            a: { id: 'a', value: 'bar1' },
            b: { id: 'b', value: 'bar2' },
            c: { id: 'C', value: 'bar3' }
          }
        }
      };

      const item = itemEntitySelector(state);
      expect(item).toEqual({
        x: { id: 'a', value: 'bar1' },
        y: { id: 'b', value: 'bar2' },
        z: { id: 'C', value: 'bar3' }
      });
    });
  });
});
