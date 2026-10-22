import { getAwsAccountId } from '../utils/getAwsAccountId';
import { log } from '../utils/log';

const logPrefix = 'deploy';

/**
 * Stops the process when the current AWS credentials belong to an account
 * other than the one the configuration defines. Exits non-zero so a CI step
 * or script running `carlin deploy` fails instead of reading the refused
 * deploy as a success.
 */
export const checkAwsAccountId = async (awsAccountId: string) => {
  try {
    const currentAwsAccountId = await getAwsAccountId();
    if (String(awsAccountId) !== String(currentAwsAccountId)) {
      throw new Error(
        `AWS account id does not match. Current is "${currentAwsAccountId}" but the defined in configuration files is "${awsAccountId}".`
      );
    }
  } catch (error) {
    if ((error as { code?: string }).code === 'CredentialsError') {
      /**
       * No credentials found.
       */
      return;
    }

    log.error(logPrefix, (error as Error).message);
    process.exit(1);
  }
};
