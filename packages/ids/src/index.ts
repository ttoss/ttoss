const SEPARATOR = ':';

/**
 * @description Converts a global id into a type and record id.
 */
export const fromGlobalId = (
  globalId: string
): { type: string; recordId: string } => {
  const decodedGlobalId = Buffer.from(globalId, 'base64').toString('utf8');
  const [type, ...recordId] = decodedGlobalId.split(SEPARATOR);
  return { type, recordId: recordId.join(SEPARATOR) };
};

/**
 * @description Converts a type and record id into a global id.
 */
export const toGlobalId = (type: string, recordId: string): string => {
  return Buffer.from(`${type}${SEPARATOR}${recordId}`).toString('base64');
};

/**
 *
 * @description Converts a record id into a list of database ids.
 */
export const fromRecordId = (recordId: string): string[] => {
  return recordId.split(SEPARATOR);
};

/**
 * @description Converts a list of database ids into a record id.
 */
export const toRecordId = (...databaseIds: string[]): string => {
  return databaseIds.join(SEPARATOR);
};
