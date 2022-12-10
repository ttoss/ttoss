jest.mock('./deployCicd');

jest.mock('./readSSHKey');

import * as commandModule from './command';
import { deployCicd } from './deployCicd';
import { faker } from '@ttoss/test-utils/faker';
import { readSSHKey } from './readSSHKey';
import yargs from 'yargs';

const cli = yargs.command(commandModule.deployCicdCommand);

const parse = (command: string, options: any = {}) => {
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
  const sshKey = faker.random.word();
  const readSSHKeyMockedValue = faker.random.word();
  const sshUrl = faker.random.word();

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
