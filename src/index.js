import makeActionCreator from './redux/makeActionCreator';
import makeReducer from './redux/makeReducer';
import { setAction, resetAction } from './redux/actions';

import createSelector from './normalization/createSelector';
import normalizationReducer from './normalization/normalizationReducer';
import getNormalizerMiddleware from './normalization/getNormalizerMiddleware';
import processRules from './normalization/processRules';

export { makeActionCreator, makeReducer, setAction, resetAction };

export {
  createSelector,
  normalizationReducer,
  getNormalizerMiddleware,
  processRules
};
