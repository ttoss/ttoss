import { fromGlobalId, fromRecordId, toGlobalId, toRecordId } from 'src/index';

test('should convert a global id into a type and record id', () => {
  const globalId = 'VXNlcjox';
  const { type, recordId } = fromGlobalId(globalId);
  expect(type).toBe('User');
  expect(recordId).toBe('1');
});

test('should convert a type and record id into a global id', () => {
  const type = 'User';
  const recordId = '1';
  const globalId = toGlobalId(type, recordId);
  expect(globalId).toBe('VXNlcjox');
});

test('should convert a record id into a list of database ids', () => {
  const recordId = '1:2:3';
  const databaseIds = fromRecordId(recordId);
  expect(databaseIds).toEqual(['1', '2', '3']);
});

test('should convert a list of database ids into a record id', () => {
  const recordId = toRecordId('1', '2', '3');
  expect(recordId).toBe('1:2:3');
});
