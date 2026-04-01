import { configCreator } from './configCreator';

/**
 * https://jamiemason.github.io/syncpack/config-file
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultConfig: any = {
  indent: '  ',
  semverGroups: [],
  sortAz: [
    'contributors',
    'dependencies',
    'devDependencies',
    'keywords',
    'peerDependencies',
    'resolutions',
    'scripts',
  ],
  sortFirst: ['name', 'version', 'description', 'author'],
  versionGroups: [
    /**
     * Exclude peer and local dependencies from version checks to avoid
     * updating peer dependencies to the latest version (e.g. React >=16.8.0).
     */
    {
      label: 'Ignore peer and local dependencies',
      dependencyTypes: ['peer', 'local'],
      isIgnored: true,
    },
  ],
};

export const syncpackConfig = configCreator(defaultConfig);
