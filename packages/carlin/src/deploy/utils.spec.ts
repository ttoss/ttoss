import { cache } from '../utils/environmentVariables';
import { faker } from '@ttoss/test-utils/faker';
import { handleDeployError, handleDeployInitialization } from './utils';

const logPrefix = faker.random.word();

test('testing handleDeployError', () => {
  /**
   * https://stackoverflow.com/a/51448240/8786986
   */
  const exitMock = jest.spyOn(process, 'exit').mockImplementation();
  handleDeployError({ error: new Error(), logPrefix });
  expect(exitMock).toHaveBeenCalledWith(1);
  exitMock.mockRestore();
});

describe('testing handleDeployInitialization', () => {
  beforeEach(() => {
    cache.clear();
  });

  const stackName = faker.random.word();

  test('return stack name with predefined stack name', async () => {
    const response = await handleDeployInitialization({ stackName, logPrefix });
    expect(response).toEqual({ stackName });
  });

  test('return stack name without predefined stack name', async () => {
    const response = await handleDeployInitialization({ logPrefix });
    expect(response).toEqual(
      expect.objectContaining({ stackName: expect.any(String) })
    );
    expect(response.stackName).not.toEqual(stackName);
  });
});
