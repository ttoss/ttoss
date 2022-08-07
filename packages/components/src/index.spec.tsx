import * as componentsModule from './index';

test.each([
  componentsModule.Accordion,
  componentsModule.InstallPwa,
  componentsModule.Modal,
  componentsModule.ToastContainer,
  componentsModule.toast,
])('should export components %#', (Component) => {
  expect(Component).toBeDefined();
});
