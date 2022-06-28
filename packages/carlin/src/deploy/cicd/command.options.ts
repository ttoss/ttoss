import { camelCase } from 'change-case';
import { pipelines } from './pipelines';
import yargs from 'yargs';

export const options = {
  cpu: {
    type: 'string',
  },
  memory: {
    type: 'string',
  },
  pipelines: {
    choices: pipelines,
    coerce: (values: string[]) => values.map((value) => camelCase(value)),
    default: [],
    description: 'Pipelines that will be implemented with the CICD stack.',
    type: 'array',
  },
  'update-repository': {
    alias: ['ur'],
    description: 'Determine if the repository image will be updated.',
    default: true,
    type: 'boolean',
  },
  'ssh-key': {
    demandOption: true,
    type: 'string',
  },
  'ssh-url': {
    demandOption: true,
    type: 'string',
  },
  'slack-webhook-url': {
    type: 'string',
  },
  /**
   * This option has the format:
   *
   * ```ts
   * Array<{
   *  name: string,
   *  value: string,
   * }>
   * ```
   */
  'task-environment': {
    alias: ['te'],
    default: [],
    describe:
      'A list of environment variables that will be passed to the ECS container task.',
    type: 'array',
  },
} as const;

export type CicdCommandOptions = Partial<{
  [key in keyof typeof options]: any;
}>;

export const getCicdConfig = () => {
  const { parsed } = yargs.config();

  if (!parsed) {
    return false;
  }

  const { argv } = parsed;

  const config: CicdCommandOptions = Object.keys(options).reduce((acc, key) => {
    const value = argv[key];

    if (value) {
      acc[key] = value;
    }

    return acc;
  }, {} as any);

  return config;
};
