export type Base64String = string;

export type ResolvedGlobalId = {
  type: string;
  recordId: string;
};

export const base64 = (i: string): Base64String => {
  return Buffer.from(i, 'ascii').toString('base64');
};

export const unbase64 = (i: Base64String): string => {
  return Buffer.from(i, 'base64').toString('ascii');
};

/**
 * Takes a type name and an ID specific to that type name, and returns a
 * "global ID" that is unique among all types.
 */
export const toGlobalId = (type: string, recordId: string | number): string => {
  return base64([type, recordId].join(':'));
};

/**
 * Takes the "global ID" created by toGlobalID, and returns the type name and ID
 * used to create it.
 */
export const fromGlobalId = (globalId: string): ResolvedGlobalId => {
  const unbasedGlobalId = unbase64(globalId);
  const [type, recordId] = unbasedGlobalId.split(':');
  return { type, recordId };
};
