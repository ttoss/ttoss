import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import { mockClient } from 'aws-sdk-client-mock';
import { CLOUDFRONT_REGION } from 'src/config';
import { invalidateCloudFront } from 'src/deploy/staticApp/invalidateCloudFront';
import { log } from 'src/utils/log';

jest.mock('src/utils/log');

const cloudFrontMock = mockClient(CloudFrontClient);

beforeEach(() => {
  cloudFrontMock.reset();
  jest.clearAllMocks();
});

const outputs = [
  { OutputKey: 'CloudFrontDistributionId', OutputValue: 'distribution-id' },
];

test('should invalidate every path of the distribution', async () => {
  cloudFrontMock.on(CreateInvalidationCommand).resolves({});

  await invalidateCloudFront({ outputs });

  const calls = cloudFrontMock.commandCalls(CreateInvalidationCommand);
  expect(calls).toHaveLength(1);
  expect(calls[0].args[0].input).toEqual({
    DistributionId: 'distribution-id',
    InvalidationBatch: {
      CallerReference: expect.any(String),
      Paths: { Items: ['/*'], Quantity: 1 },
    },
  });
});

test('should sign the request in the CloudFront region', async () => {
  cloudFrontMock.on(CreateInvalidationCommand).resolves({});

  await invalidateCloudFront({ outputs });

  const client = cloudFrontMock.call(0).thisValue as CloudFrontClient;
  await expect(client.config.region()).resolves.toEqual(CLOUDFRONT_REGION);
});

test('should log and not throw when the invalidation fails', async () => {
  const error = new Error('AccessDenied');
  cloudFrontMock.on(CreateInvalidationCommand).rejects(error);

  await expect(invalidateCloudFront({ outputs })).resolves.toBeUndefined();

  expect(log.error).toHaveBeenCalledWith('static-app', error);
});

test('should do nothing without outputs', async () => {
  await invalidateCloudFront({});

  expect(cloudFrontMock.calls()).toHaveLength(0);
});

test('should do nothing without the distribution output', async () => {
  await invalidateCloudFront({
    outputs: [{ OutputKey: 'Other', OutputValue: 'value' }],
  });

  expect(cloudFrontMock.calls()).toHaveLength(0);
});
