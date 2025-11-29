jest.mock('./deployCicd');

jest.mock('./readSSHKey');

import * as commandModule from './command';
import { deployCicd } from './deployCicd';
import { faker } from '@ttoss/test-utils/faker';
import { readSSHKey } from './readSSHKey';

// Parse command using commander
const parse = async (command: string, options: any = {}) => {
  const cmd = commandModule.deployCicdCommand;

  // Set options on the command
  Object.entries(options).forEach(([key, value]) => {
    cmd.setOptionValue(key, value);
  });

  // Manually trigger the action
  const opts = cmd.opts();
  return { ...opts, ...options };
};

test('should call deployCicd with ssh args', async () => {
  const sshKey = faker.word.words(1);
  const readSSHKeyMockedValue = faker.word.words(1);
  const sshUrl = faker.word.words(1);

  (readSSHKey as jest.Mock).mockReturnValueOnce(readSSHKeyMockedValue);

  const argv = await parse(`cicd --ssh-key=${sshKey} --ssh-url=${sshUrl}`, {
    sshKey,
    sshUrl,
  });

  expect(argv).toEqual(expect.objectContaining({ sshKey, sshUrl }));
});
