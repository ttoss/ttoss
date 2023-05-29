import { Tool } from '../executeTools';

export const turbo: Tool = async ({ syncpack, ttoss }) => {
  const turboConfig: any = {
    $schema: 'https://turborepo.org/schema.json',
    globalEnv: ['CARLIN_ENVIRONMENT'],
    pipeline: {
      '//#build:config': {
        dependsOn: [],
        outputs: [],
      },
      '//#lint': {
        dependsOn: ['//#build:config'],
        outputs: [],
      },
      '//#syncpack:list': {
        dependsOn: ['//#build:config'],
        outputs: [],
      },
      i18n: {
        dependsOn: ['//#lint', '^build'],
        outputs: ['i18n/lang/**'],
      },
      build: {
        dependsOn: ['//#lint', '//#syncpack:list', 'i18n', '^build'],
        outputs: ['build/**', 'dist/**', '.next/**', 'storybook-static/**'],
      },
      test: {
        dependsOn: ['^build'],
        outputs: [],
        inputs: [
          'src/**/*.tsx',
          'src/**/*.ts',
          'tests/**/*.ts',
          'tests/**/*.tsx',
        ],
      },
      deploy: {
        dependsOn: ['build', '^deploy'],
        outputs: ['.carlin/**'],
      },
    },
  };

  if (!ttoss) {
    delete turboConfig.pipeline['//#build:config'];

    /**
     * Remove the '//#build:config' dependency from all other tasks.
     */
    Object.keys(turboConfig.pipeline).forEach((key) => {
      turboConfig.pipeline[key].dependsOn = turboConfig.pipeline[
        key
      ].dependsOn.filter((dependency: string) => {
        return dependency !== '//#build:config';
      });
    });
  }

  if (!syncpack) {
    delete turboConfig.pipeline['//#syncpack:list'];
    turboConfig.pipeline.build.dependsOn =
      turboConfig.pipeline.build.dependsOn.filter((dependency: string) => {
        return dependency !== '//#syncpack:list';
      });
  }

  return {
    packages: ['turbo'],
    configFiles: [
      {
        name: 'turbo.json',
        content: JSON.stringify(turboConfig, null, 2),
      },
    ],
    huskyHooks: [
      ['pre-commit', 'pnpm run build-graph'],
      ['pre-commit', 'git add turbo-build-graph.png'],
    ],
    scripts: {
      build: 'turbo run build',
      'build-graph': 'turbo run build --only --graph=turbo-build-graph.png',
      test: 'turbo run test',
    },
  };
};
