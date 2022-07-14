import * as componentsModule from './index';

test.each([componentsModule.InstallPwa, componentsModule.Modal])(
  'should export components %#',
  (Component) => {
    expect(Component).toBeDefined();
  }
);
