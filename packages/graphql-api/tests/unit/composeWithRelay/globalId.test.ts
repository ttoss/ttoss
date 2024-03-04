import { fromGlobalId, toGlobalId } from '@ttoss/ids';

describe('globalId', () => {
  test('should have correct method toGlobalId()', () => {
    expect(toGlobalId('User', '789')).toBe('VXNlcjo3ODk=');
    expect(toGlobalId('Article', '22')).toBe('QXJ0aWNsZToyMg==');
  });

  test('should have correct method fromGlobalId()', () => {
    expect(fromGlobalId('VXNlcjo3ODk=')).toEqual({
      type: 'User',
      recordId: '789',
    });
    expect(fromGlobalId('QXJ0aWNsZToyMg==')).toEqual({
      type: 'Article',
      recordId: '22',
    });
  });
});
