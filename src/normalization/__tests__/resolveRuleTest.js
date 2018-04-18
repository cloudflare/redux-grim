import resolveRule from '../resolveRule';
import { targetProp, idProp, propertiesProp } from '../constants';

describe('resolveRule', () => {
  const rules = {
    noAlias: {},
    alias: { [targetProp]: 'noAlias' },
    deepAlias: { [targetProp]: 'alias' },
    idFail: { [targetProp]: 'alias', [idProp]: 'key' },
    propertiesFail: { [targetProp]: 'alias', [propertiesProp]: {} }
  };

  test('should resolve a rule without an alias', () => {
    expect(resolveRule(rules, 'noAlias')).toEqual({
      entityType: 'noAlias',
      rule: {}
    });
  });

  test('should resolve a rule a simple alias', () => {
    expect(resolveRule(rules, 'alias')).toEqual({
      entityType: 'noAlias',
      rule: {}
    });
  });

  test('should resolve a rule a deep alias', () => {
    expect(resolveRule(rules, 'deepAlias')).toEqual({
      entityType: 'noAlias',
      rule: {}
    });
  });

  test('should throw a rule with an alias and an id', () => {
    expect(() => resolveRule(rules, 'idFail')).toThrow();
  });

  test('should throw a rule with an alias and properties', () => {
    expect(() => resolveRule(rules, 'propertiesFail')).toThrow();
  });
});
