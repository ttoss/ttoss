import { configCreator } from './configCreator';

/**
 * https://jamiemason.github.io/syncpack/config-file
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultConfig: any = {
  dependencyTypes: [
    'dev',
    'overrides',
    /**
     * Exclude peer dependencies from the list of dependencies to check
     * to avoid updating peer dependencies to the latest version, as updating
     * React to the latest version instead >=16.8.0.
     */
    // 'peer',
    'pnpmOverrides',
    'prod',
    'resolutions',
  ],
  filter: '.',
  indent: '  ',
  semverGroups: [],
  semverRange: '',
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
  versionGroups: [],
};

export const syncpackConfig = configCreator(defaultConfig);
