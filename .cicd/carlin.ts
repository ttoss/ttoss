import { secrets } from './secrets';

export default {
  cpu: '4096',
  memory: '8192',
  pipelines: ['pr', 'main'],
  slackWebhookUrl: secrets.slackWebhookUrl,
  sshKey: './ssh-key',
  sshUrl: 'git@github.com:ttoss/ttoss.git',
  taskEnvironment: [
    {
      name: 'NPM_TOKEN',
      value: secrets.npmToken,
    },
  ],
};
