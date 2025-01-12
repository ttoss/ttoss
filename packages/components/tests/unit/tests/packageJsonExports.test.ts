import pkg from '../../../package.json';

test('package.json exports should export all components', () => {
  const expectedExports = pkg.exports;
  const publishConfigExports = pkg.publishConfig.exports;

  expect(expectedExports).toMatchSnapshot();
  expect(publishConfigExports).toMatchSnapshot();
});
