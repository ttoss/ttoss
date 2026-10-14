import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

import { getEnvVar } from './environmentVariables';

export const getAwsAccountId = async () => {
  const sts = new STSClient({ region: getEnvVar('REGION') });
  const { Account } = await sts.send(new GetCallerIdentityCommand({}));
  return Account;
};
