import normalize from '../normalize';
import { targetProp, idProp, propertiesProp } from '../constants';
describe('normalize', () => {
  const singleKey = 'item';
  const arrayKey = 'items';
  const nestedKey = 'nested';
  const nestedAliasKey = 'nested-alias';
  const byKey = 'byItems';
  const rules = {
    [singleKey]: {},
    [arrayKey]: { [targetProp]: singleKey },
    [nestedKey]: {
      [propertiesProp]: {
        single: singleKey,
        array: arrayKey
      }
    },
    [nestedAliasKey]: { [targetProp]: nestedKey },
    [byKey]: { [idProp]: 'name' }
  };

  test('should throw an exception for an non-normalized object', () => {
    const normalizeSpy = jest.fn(normalize);
    expect(() => {
      normalizeSpy(rules, 'not-normalized', { id: 1, prop: 'foo' }, {});
    }).toThrow();
  });

  test('should pass through null', () => {
    const result = normalize(rules, singleKey, null, {});
    expect(result).toBeNull();
  });

  test('should normalize a single item', () => {
    const state = {};
    const obj = { id: '13', prop: 'foo' };
    const result = normalize(rules, singleKey, obj, state);

    expect(result).toBe('13');
    expect(state[singleKey]['13']).not.toBe(obj);
    expect(state).toEqual({
      [singleKey]: {
        '13': { id: '13', prop: 'foo' }
      }
    });
  });

  test('should normalize a single item with an alias key', () => {
    const state = {};
    const obj = { id: '13', prop: 'foo' };
    const result = normalize(rules, arrayKey, obj, state);

    expect(result).toBe('13');
    expect(state[singleKey]['13']).not.toBe(obj);
    expect(state).toEqual({
      [singleKey]: {
        '13': { id: '13', prop: 'foo' }
      }
    });
  });

  test('should normalize an array of items', () => {
    const state = {};
    const arr = [
      { id: '13', prop: 'foo' },
      { id: '14', prop: 'bar' },
      { id: '15', prop: 'wibble' }
    ];
    const result = normalize(rules, arrayKey, arr, state);

    expect(result).toEqual(['13', '14', '15']);
    expect(state['13']).not.toBe(arr[0]);
    expect(state['14']).not.toBe(arr[1]);
    expect(state['15']).not.toBe(arr[2]);

    expect(state).toEqual({
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' }
      }
    });
  });

  test('should normalize an objects properties', () => {
    const state = {};
    const obj = {
      a: { id: '13', prop: 'foo' },
      b: { id: '14', prop: 'bar' },
      c: { id: '15', prop: 'wibble' }
    };
    const result = normalize(rules, arrayKey, obj, state);
    expect(result).toEqual({
      a: '13',
      b: '14',
      c: '15'
    });
    expect(state).toEqual({
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' },
        '15': { id: '15', prop: 'wibble' }
      }
    });
  });

  test('should normalize nested properties', () => {
    const state = {};
    const obj = {
      id: '12',
      array: [
        { id: '13', prop: 'foo' },
        { id: '14', prop: 'bar' },
        { id: '15', prop: 'wibble' }
      ],
      single: { id: '16', prop: 'floop' }
    };
    const result = normalize(rules, nestedKey, obj, state);

    expect(result).toBe('12');
    expect(state).toEqual({
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
    });
  });

  test('should resolve an alias to nested properties', () => {
    const state = {};
    const obj = {
      id: '12',
      array: [
        { id: '13', prop: 'foo' },
        { id: '14', prop: 'bar' },
        { id: '15', prop: 'wibble' }
      ],
      single: { id: '16', prop: 'floop' }
    };
    const result = normalize(rules, nestedAliasKey, obj, state);

    expect(result).toBe('12');
    expect(state).toEqual({
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
    });
  });

  test('should pass through already normalized properties', () => {
    const state = {};
    const obj = {
      id: '12',
      array: [
        { id: '13', prop: 'foo' },
        { id: '14', prop: 'bar' },
        'alreadynormalized'
      ],
      single: 'alreadynormalized'
    };
    normalize(rules, nestedKey, obj, state);
    expect(state).toEqual({
      [nestedKey]: {
        '12': {
          id: '12',
          array: ['13', '14', 'alreadynormalized'],
          single: 'alreadynormalized'
        }
      },
      [singleKey]: {
        '13': { id: '13', prop: 'foo' },
        '14': { id: '14', prop: 'bar' }
      }
    });
  });

  it('should normalize using another property instead of the id', function() {
    const state = {};
    const obj = [{ name: '13', prop: 'foo' }, { name: '14', prop: 'bar' }];
    normalize(rules, byKey, obj, state);
    expect(state).toEqual({
      [byKey]: {
        '13': { name: '13', prop: 'foo' },
        '14': { name: '14', prop: 'bar' }
      }
    });
  });
});
