jest.mock('simple-git', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { BRANCH_UNDEFINED, getCurrentBranch } from './getCurrentBranch';
import { cache, setEnvVar } from './environmentVariables';
import { faker } from '@ttoss/test-utils/faker';
import simpleGit from 'simple-git';

const branch = faker.random.word();

const branchMock = jest.fn().mockResolvedValue({ current: branch });

beforeEach(() => {
  cache.delete('BRANCH');

  (simpleGit as jest.Mock).mockReturnValue({
    branch: branchMock,
  });
});

test('should return branch from simple-git', () => {
  return expect(getCurrentBranch()).resolves.toEqual(branch);
});

test('should return BRANCH_UNDEFINED if simple-git return undefined', () => {
  branchMock.mockRejectedValue(new Error());
  return expect(getCurrentBranch()).resolves.toEqual(BRANCH_UNDEFINED);
});

test('should return BRANCH_UNDEFINED if simple-git throw', () => {
  branchMock.mockResolvedValueOnce({ current: undefined });
  return expect(getCurrentBranch()).resolves.toEqual(BRANCH_UNDEFINED);
});

test('should return branch from process.env.BRANCH', () => {
  const newBranch = faker.random.word();
  setEnvVar('BRANCH', newBranch);
  return expect(getCurrentBranch()).resolves.toEqual(newBranch);
});
