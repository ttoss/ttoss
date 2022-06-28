import { faker } from '@ttoss/test-utils/faker';
import { getCurrentBranch, getEnvironment, getPackageName } from '../utils';
import { getStackName, setPreDefinedStackName } from './stackName';
import { paramCase, pascalCase } from 'change-case';

const mockMath = Object.create(global.Math);
const randomNumber = 0.12345;
mockMath.random = () => randomNumber;
global.Math = mockMath;

const branchName = [
  faker.random.words(1),
  faker.random.words(1),
  faker.random.words(1),
  faker.random.words(1),
].join('/');

const environment = faker.random.word();

const packageName = `@${faker.random.word()}/${faker.random.word()}`;

jest.mock('../utils', () => ({
  ...(jest.requireActual('../utils') as any),
  getCurrentBranch: jest.fn(),
  getEnvironment: jest.fn(),
  getPackageName: jest.fn(),
}));

describe('testing getStackName', () => {
  test('documentation case #1', async () => {
    (getCurrentBranch as jest.Mock).mockReturnValueOnce(branchName);
    (getEnvironment as jest.Mock).mockReturnValueOnce(environment);
    (getPackageName as jest.Mock).mockReturnValueOnce(packageName);
    const preDefinedStackName = faker.random.word();
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
        `${pascalCase(packageName)}-${paramCase(branchName)}`
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
        `Stack-${randomNumber * 100000}-${paramCase(branchName)}`
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
