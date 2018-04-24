export function setAction(entityType, payload, path) {
  return {
    type: `${entityType}.set`,
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
