# Normalization

This library comprises a set of functions for dealing with normalization with
Redux. It's intended to work with GRiM, a set of functions for automating Redux
action and reducer creation.

## Why Normalize?

Normalization ensures that entities are only stored once in the state tree.
Individual reducers will record ids (or arrays of ids), rather than complete
objects. Combined with React, this means that any change to an individual entity
will be reflected wherever than entity is rendered.

Several functions are provided to deal with normalization.

* getNormalizerMiddleware: A function which creates Redux middleware which
normalizes the results of actions created by GRiM
* normalizationReducer: A reducer which stores normalized entities in the state
tree
* createSelector: Creates memoized selectors which return denormalized entities.

## Rules

The rules array specifies which entity types will be normalized. Each entry
requires at least an 'entityType' field, and other values describe how they are
normalized.

```
const rules = [
  { entityType: 'normalizedType' },
  { entityType: 'aliasType', to: 'normalizedType' },
  { 
    entityType: 'nestedType',
    nestedProps: {
      prop1: 'normalizedType',
      prop2: 'normalizedType'
    }
  },
  { entityType: 'notIdType', idProp: 'otherId' }
];
```
 
An object with only an entityType field indicates that the object will be
normalized under that entityType. E.g. state.entities[entityType]. 

### Aliases

If the rule has a `to` property, the value of that property is used to look up
the actual entity type under which items will be normalized. It must resolve to
another entity type defined in the rules array. This allows entities controlled
by different sets of actions and reducers to be normalized to the same place in
the state tree. 

Typically it's used when an endpoint returns an array, to ensure that objects in
the array are normalized to the same place as individual items.

Note, aliases can't be used with any other configuration options, such as
`nestedProp` or `idProp`

### Normalizing child properties

If the rule value has a `nestedProps` property, it's value should be an object
whose keys denote the child properties to also be normalized. The values
indicate which entity type it will be normalized under.

In the example above, nestedType has two properties, 'prop1', and 'prop2', which
will be normalized under 'normalizedType'. The process is recursive, so that if
'normalizedType' also had properties to be normalized or denormalized, this will
be managed automatically.

Cyclic dependencies aren't handled, so I don't recommend you created any.
 
### Normalizing by properties other than the id

By default, it's assumed that objects will be normalized using their `id`
properties. This can be overridden by specifying a `idProp` property in the rule
configuration. In the example above, `nestedType` objects are normalized using
their name properties. 
 
## getNormalizerMiddleware(rules, callback)
 
getNormalizerMiddleware creates a Redux middleware function which takes action
result properties and, if they are normalized, replaces them with their ids (or
arrays of ids). The normalized data is added to the action under an `entities`
property

The callback function is executed when entities are normalized. It's passed the
entityType and the original denormalized value. This is used for legacy
integration with older code at Cloudflare. It shouldn't be used otherwise. 
 
## normalizationReducer(state, action)

The normalizationReducer adds the normalized data created by the middleware to
the state tree. It also removes deleted data. 
 
## createSelector(rules, entitiesSelector, entityType, selector)
 
createSelector is a selector factory which simplifies working with normalized
entities. It creates memoized selectors which return denormalized objects. The
return value is recomputed when relevant parts of the state tree changes, making
it suitable for use with PureComponent. 

It's passed the following parameters:

* rules - the rules array which specifies which entities are normalized and how
* entitiesSelector - a selector function which is passed the state tree and
returns the part of the state tree where the normalized data is stored
* entityType - the type of the entity being selected
* selector - a selector function which returns the data from the state tree to
be denormalized.

The selector function can return either an id, an array of ids, or an object
whose property values are ids. Alternatively it can return an object with a data
property in one of the previous formats.

Note: Unlike getNormalizerMiddleware and normalizationReducer, createSelector is
almost completely independent of GRiM. Almost. With GRiM, api responses are
stored under a 'data' property, alongside a few other fields like
'isRequesting', and 'errors'. Rather than insisting the selector to point
directly to the data property, I instead first test if the result of the
selector is a data property and then denormalize that. In general I strongly
recommend that the selectors you pass to createSelector point directly to the
data you want to denormalize rather than the containing object that GRiM uses.

Usage:
```    
const rules = {...};
const entitiesSelector = state => state.entities;
const itemSelector = state => state.path.to.the.normalized.item;
const itemEntitySelector = createSelector(rules, entitiesSelector, 'itemEntityType', itemSelector);
const denormalizedItem = itemEntitySelector(state);
```