import { getSetType } from '../util';

export function setAction(entityType, payload, path) {
  return {
    type: getSetType(entityType),
    payload,
    meta: {
      entityType,
      path
    }
  };
}

export function resetAction({ includes, excludes } = {}) {
  return {
    type: 'grim.reset',
    payload: {
      excludes,
      includes
    }
  };
}
