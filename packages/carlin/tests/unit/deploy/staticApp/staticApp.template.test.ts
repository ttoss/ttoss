jest.mock('src/utils', () => {
  const PACKAGE_VERSION = '10.40.23';

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('src/utils') as any),
    getPackageVersion: jest.fn().mockReturnValue(PACKAGE_VERSION),
  };
});

import { BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME } from 'src/deploy/baseStack/config';
import {
  CLOUDFRONT_DISTRIBUTION_LOGICAL_ID,
  CLOUDFRONT_ORIGIN_ACCESS_CONTROL_LOGICAL_ID,
  ROUTE_53_RECORD_SET_GROUP_LOGICAL_ID,
  STATIC_APP_BUCKET_LOGICAL_ID,
  getStaticAppTemplate,
} from 'src/deploy/staticApp/staticApp.template';
import { faker } from '@ttoss/test-utils/faker';

const region = faker.random.word();

test.each([
  {
    spa: true,
  },
  {
    spa: false,
  },
])('should set DefaultRootObject as index.html for spa=$spa', ({ spa }) => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    spa,
  });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultRootObject
  ).toEqual('index.html');
});

/**
 * https://github.com/ttoss/ttoss/issues/295
 */
test('should add OAC configuration', () => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    spa: false,
  });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.Origins[0]
  ).toEqual({
    DomainName: {
      'Fn::GetAtt': [STATIC_APP_BUCKET_LOGICAL_ID, 'DomainName'],
    },
    Id: {
      Ref: STATIC_APP_BUCKET_LOGICAL_ID,
    },
    OriginAccessControlId: {
      'Fn::GetAtt': [CLOUDFRONT_ORIGIN_ACCESS_CONTROL_LOGICAL_ID, 'Id'],
    },
    S3OriginConfig: {
      OriginAccessIdentity: '',
    },
  });

  expect(
    template.Resources[CLOUDFRONT_ORIGIN_ACCESS_CONTROL_LOGICAL_ID].Properties
  ).toEqual({
    OriginAccessControlConfig: {
      Description: {
        'Fn::Sub': [
          'Default Origin Access Control for ${Project} project.',
          {
            Project: {
              Ref: 'Project',
            },
          },
        ],
      },
      Name: {
        Ref: 'AWS::StackName',
      },
      OriginAccessControlOriginType: 's3',
      SigningBehavior: 'always',
      SigningProtocol: 'sigv4',
    },
  });
});

test.each([
  {
    cloudfront: true,
  },
  {
    cloudfront: false,
  },
])('should set BlockPublicPolicy to false $cloudfront', ({ cloudfront }) => {
  const template = getStaticAppTemplate({
    region,
    cloudfront,
    spa: false,
  });

  expect(
    template.Resources[STATIC_APP_BUCKET_LOGICAL_ID].Properties
      .PublicAccessBlockConfiguration.BlockPublicPolicy
  ).toEqual(false);
});

test('should not add CloudFront distribution', () => {
  const template = getStaticAppTemplate({ region, cloudfront: false });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID]
  ).toBeUndefined();
});

test('should define Route53 RecordSetGroup', () => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    aliases: ['example.com'],
    hostedZoneName: 'example.com',
  });

  expect(
    template.Resources[ROUTE_53_RECORD_SET_GROUP_LOGICAL_ID].Properties
      .HostedZoneName
  ).toEqual('example.com.');

  expect(
    template.Resources[ROUTE_53_RECORD_SET_GROUP_LOGICAL_ID].Properties
      .RecordSets[0].Type
  ).toEqual('A');
});

test('should add CloudFront Function that append index.html', () => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    appendIndexHtml: true,
  });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations
  ).toEqual([
    {
      EventType: 'viewer-request',
      LambdaFunctionARN: {
        'Fn::ImportValue':
          BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME,
      },
    },
  ]);
});
