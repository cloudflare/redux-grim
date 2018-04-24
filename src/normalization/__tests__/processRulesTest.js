import processRules from '../processRules';
import { idProp, targetProp, propertiesProp } from '../constants';

describe('processRules', () => {
  test('should verify rules are valid when containing just the entity type', () => {
    expect(
      processRules([{ entityType: 'one' }, { entityType: 'two' }])
    ).toEqual({
      one: { entityType: 'one' },
      two: { entityType: 'two' }
    });
  });

  test('should verify rules are valid when containing the optional types', () => {
    expect(
      processRules([
        {
          entityType: 'one',
          [idProp]: 'id1',
          [targetProp]: 'two',
          [propertiesProp]: {
            a: 'one',
            b: 'two'
          }
        },
        {
          entityType: 'two',
          [idProp]: 'id2',
          [targetProp]: 'three',
          [propertiesProp]: {
            a: 'one',
            b: 'three'
          }
        }
      ])
    ).toEqual({
      one: {
        entityType: 'one',
        [idProp]: 'id1',
        [targetProp]: 'two',
        [propertiesProp]: {
          a: 'one',
          b: 'two'
        }
      },
      two: {
        entityType: 'two',
        [idProp]: 'id2',
        [targetProp]: 'three',
        [propertiesProp]: {
          a: 'one',
          b: 'three'
        }
      }
    });
  });

  test('should verify rules are invalid when they do not contain the entity type', () => {
    function process() {
      processRules([{ entityType: 'one' }, { [idProp]: 'id2' }]);
    }

    expect(process).toThrow();
  });

  test('should verify rules are invalid when they contain any other property', () => {
    function process() {
      processRules([{ entityType: 'one' }, { entityType: 'two', other: 123 }]);
    }

    expect(process).toThrow();
  });

  test('ensure processed rules are cached', () => {
    const arr = [{ entityType: 'one' }, { entityType: 'two' }];

    const rules1 = processRules(arr);
    const rules2 = processRules(arr);

    expect(rules1).toBe(rules2);
  });

  test('ensure processed are not cached if different arrays are processed', () => {
    const rules1 = processRules([{ entityType: 'one' }, { entityType: 'two' }]);

    const rules2 = processRules([{ entityType: 'one' }, { entityType: 'two' }]);

    expect(rules1).not.toBe(rules2);
  });

  test('ensure processed rules are not cached if the array length changes', () => {
    const arr = [{ entityType: 'one' }, { entityType: 'two' }];

    const rules1 = processRules(arr);

    arr.push({ entityType: 'three' });

    const rules2 = processRules(arr);

    expect(rules1).not.toBe(rules2);
  });
});
