import { idProp, targetProp, propertiesProp } from './constants';

// Very simple schema parsing, using typeof types.
// propName: 'string' - propName must be defined and of type 'string'.
// propName: 'number?' - propName may be undefined or have type number
// propName: 'string{}' - propName must be defined, and is an object, every
//   property of which must be a 'string'
// propName: 'number{}?' - propName may be undefined or must be an object
//   every property of which must be a 'number'
const configSchema = {
  entityType: 'string',
  [idProp]: 'string?',
  [targetProp]: 'string?',
  [propertiesProp]: 'string{}?'
};

// Used to split the schema descriptions.
// E.g. 'abc{}?'.split(/(\{\})?(\??)$/) -> ["abc", "{}", "?", ""];
const schemaRE = /(\{\})?(\??)$/;

// Verifies that every member of an array matches the specified schema, see
// above.
const verifySchema = (arr, schema) =>
  arr.every(obj => {
    const keys = new Set([...Object.keys(configSchema), ...Object.keys(obj)]);
    return Array.from(keys).every(propName => {
      const schemaValue = schema[propName];
      if (schemaValue === undefined) return;

      const [schemaType, ...rest] = schemaValue.split(schemaRE);
      const isOptional = rest.indexOf('?') > -1;
      const isObject = rest.indexOf('{}') > -1;

      const objValue = obj[propName];
      const objType = typeof objValue;

      if (isOptional && objValue === undefined) return true;

      if (isObject) {
        return (
          objType === 'object' &&
          Object.values(objValue).every(val => typeof val === schemaType)
        );
      }

      return objValue !== undefined && typeof objType === schemaType;
    });
  });

let cachedRules;
let previousRules;
let previousLength;

export default function processRules(rules) {
  if (
    cachedRules &&
    rules === previousRules &&
    rules.length === previousLength
  ) {
    return cachedRules;
  }

  if (!verifySchema(rules, configSchema)) {
    throw 'Error: normalization rules do not match schema';
  }

  cachedRules = rules.reduce((o, rule) => ((o[rule.entityType] = rule), o), {});
  previousRules = rules;
  previousLength = rules.length;
  return cachedRules;
}
