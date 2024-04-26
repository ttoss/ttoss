import AWS from 'aws-sdk';

export const getAwsAccountId = async () => {
  const sts = new AWS.STS();
  const { Account } = await sts.getCallerIdentity().promise();
  return Account;
};
