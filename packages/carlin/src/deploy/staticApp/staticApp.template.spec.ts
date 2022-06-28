jest.mock('../../utils', () => {
  const PACKAGE_VERSION = '10.40.23';

  return {
    ...(jest.requireActual('../../utils') as any),
    getPackageVersion: jest.fn().mockReturnValue(PACKAGE_VERSION),
  };
});

import {
  CLOUDFRONT_DISTRIBUTION_LOGICAL_ID,
  ROUTE_53_RECORD_SET_GROUP_LOGICAL_ID,
  getStaticAppTemplate,
} from './staticApp.template';
import { faker } from '@ttoss/test-utils/faker';

const region = faker.random.word();

test('should define default root object for spa', () => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    spa: true,
  });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultRootObject
  ).toEqual('index.html');
});

test('should define default root object as undefined for not spa', () => {
  const template = getStaticAppTemplate({
    region,
    cloudfront: true,
    spa: false,
  });

  expect(
    template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultRootObject
  ).toEqual(undefined);
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
