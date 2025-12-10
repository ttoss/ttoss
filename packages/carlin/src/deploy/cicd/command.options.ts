import { camelCase } from 'change-case';
import { pipelines } from './pipelines';

export const options = {
  cpu: {
    type: 'string',
  },
  memory: {
    type: 'string',
  },
  pipelines: {
    choices: pipelines,
    coerce: (values: string[]) => {
      return values.map((value) => {
        return camelCase(value);
      });
    },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof typeof options]: any;
}>;

/**
 * Get CICD config from command line arguments.
 * This function is kept for backward compatibility but now returns
 * an empty object since config parsing is handled by commander.
 */
export const getCicdConfig = (): CicdCommandOptions | false => {
  // Config parsing is now handled by commander in cli.ts
  // This function is kept for backward compatibility
  return {};
};
