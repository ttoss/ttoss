import { getEnvVar } from './environmentVariables';
import git from 'simple-git';

export const BRANCH_UNDEFINED = '';

/**
 * Git current branch is used to determine the name of the stack when deploying
 * resources. If we provide a `CARLIN_BRANCH` through `process.env` or by
 * options, these values will be used instead of Git current branch. Example:
 *
 * ```
 * CARLIN_BRANCH=branch-name carlin deploy --destroy
 * carlin deploy --destroy --branch=branch-name
 * ```
 *
 * This parameters is useful when you need to delete a deployment related to
 * some branch but such branch has already beed deleted.
 */
export const getCurrentBranch = async () => {
  try {
    if (getEnvVar('BRANCH')) {
      return getEnvVar('BRANCH');
    }

    const { current } = await git().branch();

    return current || BRANCH_UNDEFINED;
  } catch (err) {
    return BRANCH_UNDEFINED;
  }
};
