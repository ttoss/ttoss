jest.mock('./deployCicd');

jest.mock('./readSSHKey');

import * as commandModule from './command';
import * as yargs from 'yargs';
import { deployCicd } from './deployCicd';
import { faker } from '@ttoss/test-utils/faker';
import { readSSHKey } from './readSSHKey';

const cli = yargs.command(commandModule.deployCicdCommand);

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
