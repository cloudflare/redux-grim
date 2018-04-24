import { targetProp, propertiesProp, idProp } from './constants';

// If the rule has an alias, chain through all the rules to find the base rule.
export default function resolveRule(rules, type) {
  let rule = rules[type];
  let entityType = rule && type;

  while (rule && rule[targetProp]) {
    if (rule[idProp] || rule[propertiesProp]) {
      throw `'${targetProp}' aliases cannot be used with '${idProp}' and '${propertiesProp}' properties`;
    }
    entityType = rule[targetProp];
    rule = rules[rule[targetProp]];
  }

  return { entityType, rule };
}
