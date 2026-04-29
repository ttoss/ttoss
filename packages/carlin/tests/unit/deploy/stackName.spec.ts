import { faker } from '@ttoss/test-utils/faker';
import { kebabCase, pascalCase } from 'change-case';
import {
  getStackName,
  sanitizeStackName,
  setPreDefinedStackName,
  STACK_NAME_MAX_LENGTH,
} from 'src/deploy/stackName';
import { getCurrentBranch, getEnvironment, getPackageName } from 'src/utils';

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
  jest.mocked(getCurrentBranch).mockReturnValueOnce(bigName);
  jest.mocked(getEnvironment).mockReturnValueOnce(bigName);
  jest.mocked(getPackageName).mockReturnValueOnce(bigName);
  const stackName = await getStackName();
  expect(stackName.length).toBeLessThanOrEqual(STACK_NAME_MAX_LENGTH);
  expect(stackName).toMatch(/^[a-zA-Z][-a-zA-Z0-9]*$/);
});

describe('sanitizeStackName', () => {
  test('replaces accented characters with their ASCII base (e.g. ç → c, ã → a)', () => {
    expect(sanitizeStackName('configuração')).toEqual('configuracao');
  });

  test('removes characters that are not letters, digits, or hyphens', () => {
    expect(sanitizeStackName('hello!world')).toEqual('hello-world');
  });

  test('collapses consecutive hyphens into a single hyphen', () => {
    expect(sanitizeStackName('hello--world')).toEqual('hello-world');
  });

  test('strips leading and trailing hyphens', () => {
    expect(sanitizeStackName('-hello-world-')).toEqual('hello-world');
  });

  test('returns Stack for an empty or all-special-char input', () => {
    expect(sanitizeStackName('')).toEqual('Stack');
    expect(sanitizeStackName('---')).toEqual('Stack');
  });

  test('prefixes Stack- when result starts with a digit', () => {
    expect(sanitizeStackName('123-feature')).toEqual('Stack-123-feature');
  });

  test('handles the exact branch name from the issue report', () => {
    const branchFromIssue =
      '1356-adicionar-configuração-para-não-adicionar-os-sufixos-nos-nomes-das-campanha';
    const result = sanitizeStackName(branchFromIssue);
    // starts with a digit → Stack- prefix is added
    expect(result).toEqual(
      'Stack-1356-adicionar-configuracao-para-nao-adicionar-os-sufixos-nos-nomes-das-campanha'
    );
    expect(result).toMatch(/^[a-zA-Z][-a-zA-Z0-9]*$/);
  });

  test('stack name with special-char branch satisfies CloudFormation pattern', async () => {
    const specialBranch =
      '1356-adicionar-configuração-para-não-adicionar-sufixos';
    jest.mocked(getCurrentBranch).mockReturnValueOnce(specialBranch);
    jest.mocked(getEnvironment).mockReturnValueOnce(undefined);
    jest.mocked(getPackageName).mockReturnValueOnce('@oneclickads/graph-api');
    setPreDefinedStackName('');
    const stackName = await getStackName();
    expect(stackName).toMatch(/^[a-zA-Z][-a-zA-Z0-9]*$/);
  });
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
