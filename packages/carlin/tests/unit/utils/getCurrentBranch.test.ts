jest.mock('simple-git', () => {
  return {
    simpleGit: jest.fn(),
  };
});

import { faker } from '@ttoss/test-utils/faker';
import { simpleGit } from 'simple-git';
import { cache, setEnvVar } from 'src/utils/environmentVariables';
import {
  BRANCH_UNDEFINED,
  getCurrentBranch,
} from 'src/utils/getCurrentBranch';

const branch = faker.word.words();

const branchMock = jest.fn().mockResolvedValue({ current: branch });

beforeEach(() => {
  cache.delete('BRANCH');

  jest.mocked(simpleGit).mockReturnValue({
    branch: branchMock,
  } as unknown as ReturnType<typeof simpleGit>);
});

test('should return branch from simple-git', () => {
  return expect(getCurrentBranch()).resolves.toEqual(branch);
});

test('should return BRANCH_UNDEFINED if simple-git throw', () => {
  branchMock.mockRejectedValueOnce(new Error());
  return expect(getCurrentBranch()).resolves.toEqual(BRANCH_UNDEFINED);
});

test('should return BRANCH_UNDEFINED if simple-git return undefined', () => {
  branchMock.mockResolvedValueOnce({ current: undefined });
  return expect(getCurrentBranch()).resolves.toEqual(BRANCH_UNDEFINED);
});

test('should return branch from process.env.BRANCH', () => {
  const newBranch = faker.word.words();
  setEnvVar('BRANCH', newBranch);
  return expect(getCurrentBranch()).resolves.toEqual(newBranch);
});
