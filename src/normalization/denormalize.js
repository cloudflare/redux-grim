import resolveRule from './resolveRule';
import { propertiesProp } from './constants';
/**
 * @param {Object} rules - object specifying how entities are
 *   normalized
 * @param {id | Array[id] | object} id - Item or items to be denormalised
 * @oaram {String} entityType - key indicating the type of the normalized id/ids
 * @param {Object} state - The part of the state tree mapping from
 *   entityType => id => to the  entity data
 *
 * @return Denormalized object, or the original id parameter unchanged.
 */
export default function denormalize(rules, entityType, id, state) {
  if (!id) return id;

  const { rule, entityType: type } = resolveRule(rules, entityType);

  if (Array.isArray(id)) {
    return id.map(id => denormalize(rules, type, id, state));
  }

  // Denormalize an object - treat it as a map and denormalize the values
  if (typeof id === 'object') {
    return Object.entries(id).reduce((obj, [prop, id]) => {
      obj[prop] = denormalize(rules, type, id, state);
      return obj;
    }, {});
  }

  const stateEntity = state[type] && state[type][id];

  // The entity data may not exist in the state (it may be fetched by a separate
  // endpoint) in which case just return the id.
  if (!stateEntity) return id;

  const entity = { ...stateEntity };

  // Denormalize any child properties specified by the rule
  if (rule[propertiesProp]) {
    for (const [prop, type] of Object.entries(rule[propertiesProp])) {
      entity[prop] = denormalize(rules, type, entity[prop], state);
    }
  }

  return entity;
}
