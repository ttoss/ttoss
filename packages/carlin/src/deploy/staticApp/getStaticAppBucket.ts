import { describeStackResource } from '../cloudformation.core';

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
  } catch {
    return undefined;
  }
};
