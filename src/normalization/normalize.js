import resolveRule from './resolveRule';
import { idProp as idField, defaultId, propertiesProp } from './constants';

/**
 * @param {Object} rules - object specifying how entities are
 *   normalized
 * @oaram {String} entityType - the type of the object
 * @param {Object | Array} obj - The object, or array of objects to normalize.
 *  If the object has no id, it's assumed that all the properties of the object
 *  are the objects (of the same type), to normalize.
 * @param {Object} state - an object which will be populated with properties
 *   mapping from entityType => ids => object
 *
 * @return {number | Array | Object } - an id, or array of ids, or an object
 *  whose properties map to ids.
 */
export default function normalize(rules, entityType, obj, state) {
  if (!rules[entityType]) throw `Unrecognised entityType: ${entityType}`;

  const { rule, entityType: type } = resolveRule(rules, entityType);

  if (Array.isArray(obj)) {
    return obj.map(item => normalize(rules, type, item, state));
  }

  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const idProp = rule[idField] || defaultId;
  const id = obj[idProp];

  if (!id) {
    return Object.entries(obj).reduce((o, [prop, item]) => {
      o[prop] = normalize(rules, type, item, state);
      return o;
    }, {});
  }

  const entity = { ...obj };
  state[type] = state[type] || {};
  state[type][id] = entity;

  if (rule[propertiesProp]) {
    for (const [prop, type] of Object.entries(rule[propertiesProp])) {
      entity[prop] = normalize(rules, type, obj[prop], state);
    }
  }

  return id;
}
