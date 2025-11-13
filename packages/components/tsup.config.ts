/**
 * To avoid tsup build failing with ERR_WORKER_OUT_OF_MEMORY
 * https://github.com/egoist/tsup/issues/920#issuecomment-1862456590
 */
import { tsupConfig } from '@ttoss/config';

export const components = [
  'Accordion',
  'Drawer',
  'InstallPwa',
  'FileUploader',
  'JsonEditor',
  'JsonView',
  'List',
  'Markdown',
  'Menu',
  'Modal',
  'NavList',
  'NotificationCard',
  'NotificationsMenu',
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
  return tsupConfig(
    {
      entryPoints: groupComponents.map((component) => {
        return `src/components/${component}/index.ts`;
      }),
      format: ['esm'],
    },
    {
      arrayMerge: 'overwrite',
    }
  );
};

const numberOfGroups = Math.ceil(components.length / groupSize);

const tsupConfigs = Array.from({ length: numberOfGroups }, (_, i) => {
  return i;
}).map(getConfigByGroup);

export default tsupConfigs;
