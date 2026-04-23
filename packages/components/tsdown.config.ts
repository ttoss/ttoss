import { tsdownConfig } from '@ttoss/config';

export const components = [
  'Accordion',
  'DatePicker',
  'Drawer',
  'EnhancedTitle',
  'InstallPwa',
  'FileUploader',
  'JsonEditor',
  'JsonView',
  'List',
  'LockedOverlay',
  'Markdown',
  'Menu',
  'MetricCard',
  'Modal',
  'NavList',
  'NotificationCard',
  'NotificationsMenu',
  'SpotlightCard',
  'Search',
  'Table',
  'Tabs',
  'Toast',
];

const tsdownConfigs = components.map((component) => {
  return tsdownConfig(
    {
      entry: [`src/components/${component}/index.ts`],
      format: ['esm'],
    },
    {
      arrayMerge: 'overwrite',
    }
  );
});

export default tsdownConfigs;
