jest.mock('src/deploy/cicd/deployCicd');

jest.mock('src/deploy/cicd/readSSHKey');

import { faker } from '@ttoss/test-utils/faker';
import * as commandModule from 'src/deploy/cicd/command';
import { deployCicd } from 'src/deploy/cicd/deployCicd';
import { readSSHKey } from 'src/deploy/cicd/readSSHKey';
import yargs from 'yargs';

/**
 * yargs 18 has no global singleton, so the test builds its own instance.
 */
const cli = yargs().command(commandModule.deployCicdCommand);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parse = (command: string, options: any = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    cli.parse(command, options, (err, argv) => {
      if (err) {
        reject(err);
      } else {
        resolve(argv);
      }
    });
  });
};

test('should call deployCicd with ssh args', async () => {
  const sshKey = faker.word.words(1);
  const readSSHKeyMockedValue = faker.word.words(1);
  const sshUrl = faker.word.words(1);

  (readSSHKey as jest.Mock).mockReturnValueOnce(readSSHKeyMockedValue);

  const argv = await parse(`cicd --ssh-key=${sshKey} --ssh-url=${sshUrl}`);

  expect(argv).toEqual(expect.objectContaining({ sshKey, sshUrl }));
  expect(deployCicd).toHaveBeenCalledWith(
    expect.objectContaining({
      sshKey: readSSHKeyMockedValue,
      sshUrl,
    })
  );
});
