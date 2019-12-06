import { static as Immutable } from 'seamless-immutable';

// Updates entities in response to any action with response.entities.
// Depends on the normalizerMiddelware
export default function normalizationReducer(state = {}, { meta }) {
  if (meta) {
    if (meta.method === 'delete') {
      if (state[meta.entityType] && meta.id) {
        // Only a single item can be deleted at a time.
        return Immutable.set(
          state,
          meta.entityType,
          Immutable.without(state[meta.entityType], meta.id)
        );
      }
    } else if (meta.entities && typeof meta.entities === 'object') {
      // Using seamless-immutable's deep merge resulted in an issue where an
      // entity was supposed to have had a set of associated objects removed
      // by setting the property to an empty object, but the deep merge retained
      // those objects.
      // Instead each entity type is merged separately using a shallow merge,
      // which effectively replaces rather than merges individual entities.
      let nextState = state;
      Object.keys(meta.entities).forEach(
        entityType =>
          (nextState = Immutable.set(
            nextState,
            entityType,
            Immutable.merge({}, [
              state[entityType] || {},
              meta.entities[entityType]
            ])
          ))
      );
      return nextState;
    }
  }
  return state;
}
