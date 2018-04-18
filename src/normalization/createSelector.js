import { static as Immutable } from 'seamless-immutable';
import resolveRule from './resolveRule';
import denormalize from './denormalize';
import processRules from './processRules';
import { propertiesProp } from './constants';

/**
 * Test if two arrays are the same, or contain the same contents
 */
export function arrayEquals(arr1, arr2) {
  return (
    arr1 === arr2 ||
    (arr1 &&
      arr2 &&
      arr1.length === arr2.length &&
      arr1.every((item, ii) => item === arr2[ii]))
  );
}

/**
 * Build an array of all dependant entity types.
 * Note: This doesn't handle cyclic dependencies. Please don't introduce any.
 */
export function getEntityTypes(rules, type) {
  const { rule, entityType } = resolveRule(rules, type);
  let entityTypes = entityType && [entityType];
  if (rule && rule[propertiesProp]) {
    for (const key of Object.values(rule[propertiesProp])) {
      entityTypes = [...entityTypes, ...getEntityTypes(rules, key)];
    }
  }
  return entityTypes;
}

/**
 * Creates a memoized selector which returns denormalized objects.
 *
 * @param rules {object} optional - Describes how objects are normalized
 * @param entitiesSelector {function} - selector function which takes the state
 *   and returns the part of the state tree where normalized entity data lives.
 * @param entityType {string} - the type of the entity being selected
 * @param selector {function} - selector function. See below.
 * @returns a memoized selector function which returns denormalized entities.
 *
 * The selector parameter is a function which takes the state and resolves to
 * one of three types:
 * 1. an id.
 *    The entity selector returns the object corresponding to the id
 * 2. an array of ids
 *    The entity selector returns array of objects corresponding to the array of
 *    ids
 * 3. an object whose properties map to ids
 *    The entity selector returns an object whose properties map to the
 *    corresponding objects.
 *
 * Note: The selector parameter function can return either the id directly
 * or an object with a data property (because we use the format {
 *   data: id,
 *   isRequesting: true
 *   errors: [...]
 * }) where the value of the data property is the id, array of ids etc
 */
export default function createSelector(
  arrayRules,
  entitiesSelector,
  entityType,
  selector
) {
  const rules = processRules(arrayRules);
  if (!rules[entityType]) throw `Key not found ${entityType}`;
  const keys = [...new Set(getEntityTypes(rules, entityType))];

  const selectors = [
    // Only create a dependency on the normalized id (the data property of the
    // object in the store for most cases).
    state => {
      const selection = selector(state);
      const isObject = selection && typeof selection === 'object';

      // This was a bad design decision. It's the only direct link with how
      // objects are stored with Grim. Ideally the selector passed should
      // point to the data property directly.
      return isObject && 'data' in selection ? selection.data : selection;
    },
    // Turn keys into selectors
    ...keys.map(key => state => entitiesSelector(state)[key])
  ];

  let lastSelected;
  let lastDenormalized;

  return state => {
    const selected = selectors.map(selector => selector(state));
    if (!arrayEquals(selected, lastSelected)) {
      lastSelected = selected;
      lastDenormalized = Immutable.from(
        denormalize(rules, entityType, selected[0], entitiesSelector(state))
      );
    }
    return lastDenormalized;
  };
}
