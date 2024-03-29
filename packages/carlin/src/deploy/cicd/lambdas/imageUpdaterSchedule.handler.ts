import { CICD_FOLDER_NAME } from '../config';
import { ScheduledHandler } from 'aws-lambda';
import { executeTasks } from './executeTasks';
import { shConditionalCommands } from './shConditionalCommands';

/**
 * Update CI/CD resources with the newest carlin and repository image.
 */
export const imageUpdaterScheduleHandler: ScheduledHandler = async () => {
  const cicdConfig = process.env.CICD_CONFIG;

  if (!cicdConfig) {
    return;
  }

  const command = shConditionalCommands({
    conditionalCommands: [
      /**
       * -e  Exit immediately if a command exits with a non-zero status.
       */
      'set -e',
      'git status',
      'git fetch',
      'git pull origin main',
      'git rev-parse HEAD',
      'yarn global add carlin',
      `cd ${CICD_FOLDER_NAME}`,
      'echo $CICD_CONFIG > carlin.json',
      'cat carlin.json',
      `carlin deploy cicd -c carlin.json`,
    ],
  });

  await executeTasks({
    commands: [command],
    cpu: '512',
    memory: '2048',
    taskEnvironment: [
      {
        name: 'CICD_CONFIG',
        value: cicdConfig,
      },
    ],
  });
};
