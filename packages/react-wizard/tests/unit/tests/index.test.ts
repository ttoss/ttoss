import * as ReactWizard from 'src/index';

describe('react-wizard exports', () => {
  test('exports the public runtime API', () => {
    expect(ReactWizard.Wizard).toBeDefined();
    expect(ReactWizard.useWizard).toBeDefined();
  });
});
