import * as defaultTokens from 'src/defaultTokens';

test('defaultTokens cannot be changed', () => {
  expect(defaultTokens).toMatchSnapshot();
});
