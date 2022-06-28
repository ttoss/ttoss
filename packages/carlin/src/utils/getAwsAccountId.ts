import { STS } from 'aws-sdk';

export const getAwsAccountId = async () => {
  const sts = new STS();
  const { Account } = await sts.getCallerIdentity().promise();
  return Account;
};
