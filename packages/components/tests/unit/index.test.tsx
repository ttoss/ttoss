import * as componentsModule from '../../src/index';

test.each([
  componentsModule.Accordion,
  componentsModule.InstallPwa,
  componentsModule.Modal,
  componentsModule.ToastContainer,
  componentsModule.toast,
  componentsModule.Markdown,
  componentsModule.Menu,
])('should export components %#', (Component) => {
  expect(Component).toBeDefined();
});
