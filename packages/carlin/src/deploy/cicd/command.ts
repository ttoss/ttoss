/* eslint-disable no-param-reassign */
import { Command } from 'commander';
import { NAME } from '../../config';
import { deployCicd } from './deployCicd';
import { options } from './command.options';
import { readSSHKey } from './readSSHKey';
import log from 'npmlog';

const logPrefix = 'deploy-cicd';

export const deployCicdCommand = new Command('cicd')
  .description('Deploy CICD.')
  .allowUnknownOption(true)
  .option('--cpu <cpu>', options.cpu.type === 'string' ? 'CPU allocation' : '')
  .option('--memory <memory>', options.memory.type === 'string' ? 'Memory allocation' : '')
  .option('--pipelines <pipelines...>', options.pipelines.description)
  .option('--update-repository', options['update-repository'].description, options['update-repository'].default)
  .option('--ssh-key <key>', 'SSH key path')
  .option('--ssh-url <url>', 'SSH URL')
  .option('--slack-webhook-url <url>', 'Slack webhook URL')
  .option('--task-environment <envs...>', options['task-environment'].describe)
  .action(async function (this: Command) {
    const opts = this.opts();
    const parentOpts = this.parent?.parent?.opts() || {};
    const allOpts = { ...parentOpts, ...opts };

    if (allOpts.destroy) {
      log.info(logPrefix, `${NAME} doesn't destroy CICD stack.`);
    } else {
      await deployCicd({
        ...allOpts,
        sshKey: readSSHKey(allOpts.sshKey),
      } as any);
    }
  });
