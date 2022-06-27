import { describeStackResource } from '../cloudFormation.core';

const STATIC_APP_BUCKET_LOGICAL_ID = 'StaticBucket';

export const getStaticAppBucket = async ({
  stackName,
}: {
  stackName: string;
}) => {
  const params = {
    LogicalResourceId: STATIC_APP_BUCKET_LOGICAL_ID,
    StackName: stackName,
  };
  try {
    const { StackResourceDetail } = await describeStackResource(params);
    return StackResourceDetail?.PhysicalResourceId;
  } catch (error) {
    return undefined;
  }
};
