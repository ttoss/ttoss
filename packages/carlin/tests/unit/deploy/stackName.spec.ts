import {
  STACK_NAME_MAX_LENGTH,
  getStackName,
  setPreDefinedStackName,
} from 'src/deploy/stackName';
import { faker } from '@ttoss/test-utils/faker';
import { getCurrentBranch, getEnvironment, getPackageName } from 'src/utils';
import { kebabCase, pascalCase } from 'change-case';

const mockMath = Object.create(global.Math);
const randomNumber = 0.12345;
mockMath.random = () => {
  return randomNumber;
};
global.Math = mockMath;

const branchName = [
  faker.lorem.words(1),
  faker.lorem.words(1),
  faker.lorem.words(1),
  faker.lorem.words(1),
].join('/');

const environment = faker.lorem.word();

const packageName = `@${faker.lorem.word()}/${faker.word.words()}`;

jest.mock('src/utils', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('src/utils') as any),
    getCurrentBranch: jest.fn(),
    getEnvironment: jest.fn(),
    getPackageName: jest.fn(),
  };
});

test('limit stackName length', async () => {
  const bigName = faker.lorem.words(2 * STACK_NAME_MAX_LENGTH);
  (getCurrentBranch as jest.Mock).mockReturnValueOnce(bigName);
  (getEnvironment as jest.Mock).mockReturnValueOnce(bigName);
  (getPackageName as jest.Mock).mockReturnValueOnce(bigName);
  const stackName = await getStackName();
  expect(stackName.length).toEqual(STACK_NAME_MAX_LENGTH);
});

describe('testing getStackName', () => {
  test('documentation case #1', async () => {
    (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
    (getEnvironment as jest.Mock).mockReturnValueOnce(environment);
    (getPackageName as jest.Mock).mockReturnValueOnce(packageName);
    const preDefinedStackName = faker.word.words();
    setPreDefinedStackName(preDefinedStackName);
    const stackName = await getStackName();
    expect(stackName).toEqual(preDefinedStackName);
  });

  describe('pre-defined stack name not defined', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      setPreDefinedStackName('');
    });

    test('documentation case #2', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
      (getEnvironment as jest.Mock).mockReturnValueOnce(environment);
      (getPackageName as jest.Mock).mockReturnValueOnce(packageName);
      const stackName = await getStackName();
      expect(stackName).toEqual(`${pascalCase(packageName)}-${environment}`);
    });

    test('documentation case #3', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
      (getEnvironment as jest.Mock).mockReturnValueOnce(undefined);
      (getPackageName as jest.Mock).mockReturnValueOnce(packageName);
      const stackName = await getStackName();
      expect(stackName).toEqual(
        `${pascalCase(packageName)}-${kebabCase(branchName)}`
      );
    });

    test('documentation case #4', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(undefined);
      (getEnvironment as jest.Mock).mockReturnValueOnce(undefined);
      (getPackageName as jest.Mock).mockReturnValueOnce(packageName);
      const stackName = await getStackName();
      expect(stackName).toEqual(`${pascalCase(packageName)}`);
    });

    test('documentation case #5', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
      (getEnvironment as jest.Mock).mockReturnValueOnce(environment);
      (getPackageName as jest.Mock).mockReturnValueOnce(undefined);
      const stackName = await getStackName();
      expect(stackName).toEqual(
        `Stack-${randomNumber * 100000}-${environment}`
      );
    });

    test('documentation case #6', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
      (getEnvironment as jest.Mock).mockReturnValueOnce(undefined);
      (getPackageName as jest.Mock).mockReturnValueOnce(undefined);
      const stackName = await getStackName();
      expect(stackName).toEqual(
        `Stack-${randomNumber * 100000}-${kebabCase(branchName)}`
      );
    });

    test('documentation case #7', async () => {
      (getCurrentBranch as jest.Mock).mockReturnValueOnce(undefined);
      (getEnvironment as jest.Mock).mockReturnValueOnce(undefined);
      (getPackageName as jest.Mock).mockReturnValueOnce(undefined);
      const stackName = await getStackName();
      expect(stackName).toEqual(`Stack-${randomNumber * 100000}`);
    });
  });
});
