/**
 * To avoid tsup build failing with ERR_WORKER_OUT_OF_MEMORY
 * https://github.com/egoist/tsup/issues/920#issuecomment-1862456590
 */
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

/**
 * Cannot set size in such a way that a group has only one component.
 * If this happens, tsup won't create a folder for the component and
 * the exports of the component will be in the root of the dist folder.
 */
let groupSize = 4;

while (components.length % groupSize === 1) {
  groupSize++;
}

const getConfigByGroup = (group: number) => {
  const start = group * groupSize;
  const end = start + groupSize;
  const groupComponents = components.slice(start, end);
  return tsdownConfig(
    {
      entry: groupComponents.map((component) => {
        return `src/components/${component}/index.ts`;
      }),
      format: ['esm'],
      dts: {
        compilerOptions: {
          noCheck: true,
        },
      },
    },
    {
      arrayMerge: 'overwrite',
    }
  );
};

const numberOfGroups = Math.ceil(components.length / groupSize);

const tsdownConfigs = Array.from({ length: numberOfGroups }, (_, i) => {
  return i;
}).map(getConfigByGroup);

export default tsdownConfigs;
