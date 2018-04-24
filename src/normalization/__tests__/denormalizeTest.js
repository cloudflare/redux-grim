import denormalize from '../denormalize';
import { targetProp, propertiesProp } from '../constants';

describe('denormalize', () => {
  const singleKey = 'item';
  const arrayKey = 'items';
  const nestedKey = 'nested';
  const nestedAliasKey = 'nested-alias';

  // These are the transformed rules - see reduceRules
  const rules = {
    [singleKey]: {},
    [arrayKey]: { [targetProp]: singleKey },
    [nestedKey]: {
      [propertiesProp]: {
        single: singleKey,
        array: arrayKey
      }
    },
    [nestedAliasKey]: { [targetProp]: nestedKey }
  };

  test('should denormalize a single object', () => {
    const state = {
      [singleKey]: {
        '13': { id: '13', prop: 'foo' }
      }
    };
    const obj = denormalize(rules, singleKey, '13', state);
    expect(obj).toEqual({ id: '13', prop: 'foo' });
  });

  test('should denormalize a single object through an alias', () => {
    const state = {
      [singleKey]: {
        '13': { id: '13', prop: 'foo' }
      }
    };
    const obj = denormalize(rules, arrayKey, '13', state);
    expect(obj).toEqual({ id: '13', prop: 'foo' });
  });

  test('should denormalize a array', () => {
    const state = {
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' }
      }
    };
    const arr = denormalize(rules, arrayKey, ['13', '14', '15'], state);
    expect(arr).toEqual([
      { id: '13', prop: 'foo' },
      { id: '14', prop: 'bar' },
      { id: '15', prop: 'wibble' }
    ]);
  });

  test('should denormalize nested properties', () => {
    const state = {
      [nestedKey]: {
        '12': {
          id: '12',
          array: ['13', '14', '15'],
          single: '16'
        }
      },
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' },
        '16': { id: '16', prop: 'floop' }
      }
    };
    const obj = denormalize(rules, nestedKey, '12', state);
    expect(obj).toEqual({
      id: '12',
      array: [
        { id: '13', prop: 'foo' },
        { id: '14', prop: 'bar' },
        { id: '15', prop: 'wibble' }
      ],
      single: { id: '16', prop: 'floop' }
    });
  });

  test('should denormalize nested properties through an alias', () => {
    const state = {
      [nestedKey]: {
        '12': {
          id: '12',
          array: ['13', '14', '15'],
          single: '16'
        }
      },
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' },
        '16': { id: '16', prop: 'floop' }
      }
    };
    const obj = denormalize(rules, nestedAliasKey, '12', state);
    expect(obj).toEqual({
      id: '12',
      array: [
        { id: '13', prop: 'foo' },
        { id: '14', prop: 'bar' },
        { id: '15', prop: 'wibble' }
      ],
      single: { id: '16', prop: 'floop' }
    });
  });

  test('should denormalize an object whose properties map to entities', () => {
    const state = {
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' }
      }
    };
    const obj = denormalize(
      rules,
      singleKey,
      {
        foo1: '13',
        foo2: '14',
        foo3: '15'
      },
      state
    );
    expect(obj).toEqual({
      foo1: { id: '13', prop: 'foo' },
      foo2: { id: '14', prop: 'bar' },
      foo3: { id: '15', prop: 'wibble' }
    });
  });

  test('should pass through null properties', () => {
    const state = {
      [nestedKey]: {
        '12': {
          id: '12',
          array: ['13', null, '15'],
          single: null
        }
      },
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '15': { id: '15', prop: 'wibble' }
      }
    };
    const obj = denormalize(rules, nestedKey, '12', state);
    expect(obj).toEqual({
      id: '12',
      array: [{ id: '13', prop: 'foo' }, null, { id: '15', prop: 'wibble' }],
      single: null
    });
  });

  test("should pass through properties that don't map to entities in the state tree", () => {
    const state = {
      [nestedKey]: {
        '12': {
          id: '12',
          array: ['13', '17', '15'],
          single: '18'
        }
      },
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '15': { id: '15', prop: 'wibble' }
      }
    };
    const obj = denormalize(rules, nestedKey, '12', state);
    expect(obj).toEqual({
      id: '12',
      array: [{ id: '13', prop: 'foo' }, '17', { id: '15', prop: 'wibble' }],
      single: '18'
    });
  });
});
