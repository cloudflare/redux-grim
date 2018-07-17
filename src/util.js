const startExtension = '.start';
const successExtension = '.success';
const errorExtension = '.error';

export const getStartType = entityType => `${entityType}${startExtension}`;
export const getSuccessType = entityType => `${entityType}${successExtension}`;
export const getErrorType = entityType => `${entityType}${errorExtension}`;

export const isStartType = type => type.endsWith(startExtension);
export const isSuccessType = type => type.endsWith(successExtension);
export const isErrorType = type => type.endsWith(errorExtension);
