import getNormalizerMiddleware from '../getNormalizerMiddleware';
import { targetProp, propertiesProp } from '../constants';
import { getSuccessType, getStartType } from '../../util';

const singleKey = 'item';
const arrayKey = 'items';
const nestedKey = 'nested';
const rules = [
  { entityType: singleKey },
  { entityType: arrayKey, [targetProp]: singleKey },
  {
    entityType: nestedKey,
    [propertiesProp]: {
      single: singleKey,
      array: arrayKey
    }
  }
];

describe('normalizer middleware', () => {
  const fakeNext = args => args;
  const normalizerMiddleware = getNormalizerMiddleware(rules);
  const normalizeAction = action => normalizerMiddleware()(fakeNext)(action);

  const makeId = chr => chr.repeat(32);
  const id = makeId('a');
  const id1 = makeId('b');
  const id2 = makeId('c');
  const value = 'something, something, oranges, something';
  const singleResult = { id, value };
  const arrayResult = [{ id: id1, value }, { id: id2, value }];
  const normalizedEntityType = 'item';
  const unnormalizedEntityType = 'not a normalized key';

  describe('entities', () => {
    test('should not add entities for an unnormalized result', () => {
      const action = {
        type: getSuccessType(unnormalizedEntityType),
        payload: singleResult,
        meta: { entityType: unnormalizedEntityType }
      };
      const newAction = normalizeAction(action);
      expect(newAction.payload).toBe(singleResult);
      expect(newAction.meta.entityType).toBe(unnormalizedEntityType);
      expect(newAction.meta.entities).toBeUndefined();
    });

    test('should add entities for a normalized single result', () => {
      const action = {
        type: getSuccessType(normalizedEntityType),
        payload: singleResult,
        meta: { entityType: normalizedEntityType }
      };

      const newAction = normalizeAction(action);
      expect(newAction.meta.entities).toEqual({
        item: { [id]: singleResult }
      });
      expect(newAction.payload).toBe(id);
    });

    test('should not add entities for other action types', () => {
      const action = {
        type: getStartType(normalizedEntityType),
        payload: singleResult,
        meta: { entityType: normalizedEntityType }
      };

      const newAction = normalizeAction(action);
      expect(newAction.payload).toBe(singleResult);
      expect(newAction.meta.entityType).toBe(normalizedEntityType);
      expect(newAction.meta.entities).toBeUndefined();
    });

    test('should add entities for a normalized array result', () => {
      const action = {
        type: getSuccessType(normalizedEntityType),
        payload: arrayResult,
        meta: { entityType: normalizedEntityType }
      };

      const newAction = normalizeAction(action);
      expect(newAction.meta.entities).toEqual({
        item: {
          [id1]: { id: id1, value },
          [id2]: { id: id2, value }
        }
      });
      expect(newAction.payload).toEqual([id1, id2]);
    });

    test('should ignore a null result for a normalized action', () => {
      const action = {
        type: getSuccessType(normalizedEntityType),
        payload: null,
        meta: { entityType: normalizedEntityType }
      };
      const newAction = normalizeAction(action);
      expect(newAction.payload).toBeNull();
    });

    test('should ignore a null result for a unnormalized action', () => {
      const action = {
        type: getSuccessType(normalizedEntityType),
        payload: null,
        meta: { entityType: unnormalizedEntityType }
      };
      const newAction = normalizeAction(action);
      expect(newAction.payload).toBeNull();
    });
  });
});
