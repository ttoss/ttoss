import { getSession, signIn, signOut } from 'src/session';

describe('session', () => {
  test('starts signed out', () => {
    expect(getSession()).toBeNull();
  });

  test('signIn / signOut roundtrip', () => {
    signIn({ email: 'ana@northline.dev' });
    expect(getSession()).toEqual({ email: 'ana@northline.dev' });

    signOut();
    expect(getSession()).toBeNull();
  });

  test('corrupted storage payload reads as signed out', () => {
    window.sessionStorage.setItem('meridian.session', '{not json');
    expect(getSession()).toBeNull();
  });
});
