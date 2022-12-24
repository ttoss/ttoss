import * as relayAmplify from '../../src';

test('should export createEnvironment', () => {
  expect(relayAmplify).toHaveProperty('createEnvironment');
});

test('should export fetchQuery', () => {
  expect(relayAmplify).toHaveProperty('fetchQuery');
});
