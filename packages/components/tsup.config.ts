import { tsupConfig } from '@ttoss/config';

export const components = [
  'Accordion',
  'Drawer',
  'InstallPwa',
  'List',
  'Markdown',
  'Menu',
  'Modal',
  'Search',
  'Table',
  'Toast',
];

/**
 * Cannot set size in such a way that a group has only one component.
 * If this happens, tsup won't create a folder for the component and
 * the exports of the component will be in the root of the dist folder.
 */
const GROUP_SIZE = 5;

/**
 * To avoid tsup build failing with ERR_WORKER_OUT_OF_MEMORY
 * https://github.com/egoist/tsup/issues/920#issuecomment-1862456590
 */
const getConfigByGroup = (group: number) => {
  const start = group * GROUP_SIZE;
  const end = start + GROUP_SIZE;
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

export const tsup0 = getConfigByGroup(0);
export const tsup1 = getConfigByGroup(1);

export default [tsup0, tsup1];
