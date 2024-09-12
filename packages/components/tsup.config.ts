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

const GROUP_SIZE = 3;

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
export const tsup2 = getConfigByGroup(2);
export const tsup3 = getConfigByGroup(3);

export default [tsup0, tsup1, tsup2, tsup3];
