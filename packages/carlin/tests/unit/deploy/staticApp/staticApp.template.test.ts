import { faker } from '@ttoss/test-utils/faker';
import { BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME } from 'src/deploy/baseStack/config';
import {
  getResponseHeadersPolicyConfig,
  parseResponseHeaders,
} from 'src/deploy/staticApp/responseHeaders';
import {
  BUCKET_CORS_CONFIGURATION,
  CLOUDFRONT_DISTRIBUTION_LOGICAL_ID,
  CLOUDFRONT_ORIGIN_ACCESS_CONTROL_LOGICAL_ID,
  CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID,
  CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID,
  getStaticAppTemplate,
  ORIGIN_RESPONSE_POLICY_ID,
  ROUTE_53_RECORD_SET_GROUP_LOGICAL_ID,
  STATIC_APP_BUCKET_LOGICAL_ID,
} from 'src/deploy/staticApp/staticApp.template';
import {
  APPEND_INDEX_HTML_HELPER,
  FUNCTION_RUNTIME,
} from 'src/deploy/staticApp/viewerRequestFunction';

jest.mock('src/utils', () => {
  const PACKAGE_VERSION = '10.40.23';

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(jest.requireActual('src/utils') as any),
    getPackageVersion: jest.fn().mockReturnValue(PACKAGE_VERSION),
  };
});

const region = faker.word.words();

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
      .DistributionConfig.DefaultCacheBehavior.FunctionAssociations
  ).toEqual([
    {
      EventType: 'viewer-request',
      FunctionARN: {
        'Fn::ImportValue':
          BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME,
      },
    },
  ]);
});

describe('response headers', () => {
  const getDefaultCacheBehavior = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any
  ) => {
    return template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultCacheBehavior;
  };

  test('should keep the managed policy when no option is defined', () => {
    const template = getStaticAppTemplate({ region, cloudfront: true });

    expect(getDefaultCacheBehavior(template).ResponseHeadersPolicyId).toEqual(
      ORIGIN_RESPONSE_POLICY_ID
    );

    expect(template.Resources).not.toHaveProperty(
      CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID
    );
  });

  test('should create a policy when response headers are defined', () => {
    const responseHeaders = parseResponseHeaders({
      'content-security-policy': "default-src 'self'",
    });

    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      responseHeaders,
    });

    expect(getDefaultCacheBehavior(template).ResponseHeadersPolicyId).toEqual({
      'Fn::GetAtt': [CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID, 'Id'],
    });

    expect(
      template.Resources[CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID]
    ).toEqual({
      Type: 'AWS::CloudFront::ResponseHeadersPolicy',
      Properties: {
        ResponseHeadersPolicyConfig: getResponseHeadersPolicyConfig({
          responseHeaders,
        }),
      },
    });
  });

  test('should use the response headers policy id when it is an id', () => {
    const responseHeadersPolicy = '67f7725c-6f97-4210-82d7-5512b31e9d03';

    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      responseHeadersPolicy,
    });

    expect(getDefaultCacheBehavior(template).ResponseHeadersPolicyId).toEqual(
      responseHeadersPolicy
    );

    expect(template.Resources).not.toHaveProperty(
      CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID
    );
  });

  test('should import the response headers policy id when it is an exported name', () => {
    const responseHeadersPolicy = faker.word.words().replace(/\s/g, '');

    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      responseHeadersPolicy,
    });

    expect(getDefaultCacheBehavior(template).ResponseHeadersPolicyId).toEqual({
      'Fn::ImportValue': responseHeadersPolicy,
    });
  });

  /**
   * Response headers are applied by CloudFront, so there is nothing to attach
   * them to on a bucket-only deploy.
   */
  test('should not create a policy without cloudfront', () => {
    const template = getStaticAppTemplate({
      region,
      cloudfront: false,
      responseHeaders: parseResponseHeaders({ 'x-custom': 'some-value' }),
    });

    expect(template.Resources).not.toHaveProperty(
      CLOUDFRONT_RESPONSE_HEADERS_POLICY_LOGICAL_ID
    );
  });
});

describe('viewer request function', () => {
  const viewerRequestFunctionCode = `function handler(event) {
  return appendIndexHtml(event.request);
}`;

  const getFunctionAssociations = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any
  ) => {
    return template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig.DefaultCacheBehavior.FunctionAssociations;
  };

  test('should create a per app function and associate it', () => {
    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      viewerRequestFunctionCode,
    });

    const resource =
      template.Resources[CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID];

    expect(resource.Type).toEqual('AWS::CloudFront::Function');
    expect(resource.Properties?.AutoPublish).toEqual(true);
    expect(resource.Properties?.Name).toEqual({ Ref: 'AWS::StackName' });
    expect(resource.Properties?.FunctionConfig.Runtime).toEqual(
      FUNCTION_RUNTIME
    );

    expect(getFunctionAssociations(template)).toEqual([
      {
        EventType: 'viewer-request',
        FunctionARN: {
          'Fn::GetAtt': [
            CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID,
            'FunctionMetadata.FunctionARN',
          ],
        },
      },
    ]);
  });

  test('should inject the appendIndexHtml helper into the function code', () => {
    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      viewerRequestFunctionCode,
    });

    expect(
      template.Resources[CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID]
        .Properties?.FunctionCode
    ).toEqual(`${APPEND_INDEX_HTML_HELPER}\n\n${viewerRequestFunctionCode}\n`);
  });

  /**
   * A cache behavior takes a single viewer request function, so a config that
   * would need two associations must fail at synth time.
   */
  test('should throw when combined with appendIndexHtml', () => {
    return expect(() => {
      return getStaticAppTemplate({
        region,
        cloudfront: true,
        appendIndexHtml: true,
        viewerRequestFunctionCode,
      });
    }).toThrow('mutually exclusive');
  });

  test('should replace the shared base stack function instead of appending to it', () => {
    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      viewerRequestFunctionCode,
    });

    expect(getFunctionAssociations(template)).toHaveLength(1);
    expect(JSON.stringify(template)).not.toContain(
      BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME
    );
  });

  test('should not create the function nor associate one when unset', () => {
    const template = getStaticAppTemplate({ region, cloudfront: true });

    expect(template.Resources).not.toHaveProperty(
      CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID
    );
    expect(getFunctionAssociations(template)).toBeUndefined();
  });

  /**
   * An appendIndexHtml deploy keeps importing the shared base stack function
   * and gains no per app resource, so it deploys as it did before this option
   * existed.
   */
  test('should not create a per app function for an appendIndexHtml deploy', () => {
    const template = getStaticAppTemplate({
      region,
      cloudfront: true,
      appendIndexHtml: true,
    });

    expect(template.Resources).not.toHaveProperty(
      CLOUDFRONT_VIEWER_REQUEST_FUNCTION_LOGICAL_ID
    );

    expect(getFunctionAssociations(template)).toEqual([
      {
        EventType: 'viewer-request',
        FunctionARN: {
          'Fn::ImportValue':
            BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_ARN_EXPORTED_NAME,
        },
      },
    ]);
  });
});

/**
 * A policy that defines `vary` has no CorsConfig, so CloudFront stops
 * synthesizing the CORS headers and forwards whatever the origin sends. The
 * bucket has to answer CORS itself for that to be a wash, on both template
 * branches.
 */
test.each([[true], [false]])(
  'should configure the bucket for CORS with cloudfront=%p',
  (cloudfront) => {
    const template = getStaticAppTemplate({ region, cloudfront });

    expect(
      template.Resources[STATIC_APP_BUCKET_LOGICAL_ID].Properties
        .CorsConfiguration
    ).toEqual(BUCKET_CORS_CONFIGURATION);
  }
);

/**
 * The origin can only serve reads, so advertising the write methods of the
 * managed policy would be fiction.
 */
test('should allow only the methods the bucket serves', () => {
  expect(BUCKET_CORS_CONFIGURATION.CorsRules[0].AllowedMethods).toEqual([
    'GET',
    'HEAD',
  ]);
});

describe('acm', () => {
  const getDistributionConfig = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any
  ) => {
    return template.Resources[CLOUDFRONT_DISTRIBUTION_LOGICAL_ID].Properties
      .DistributionConfig;
  };

  const acmArn =
    'arn:aws:acm:us-east-1:123456789012:certificate/abcdef01-2345-6789-abcd-ef0123456789';

  test('should take the certificate arn as given', () => {
    const aliases = [faker.internet.domainName()];

    const distributionConfig = getDistributionConfig(
      getStaticAppTemplate({ region, cloudfront: true, acm: acmArn, aliases })
    );

    expect(distributionConfig.Aliases).toEqual(aliases);
    expect(distributionConfig.ViewerCertificate).toEqual({
      AcmCertificateArn: acmArn,
      MinimumProtocolVersion: 'TLSv1.2_2021',
      SslSupportMethod: 'sni-only',
    });
  });

  test('should import the certificate arn when it is an exported name', () => {
    const acm = faker.word.words().replace(/\s/g, '');

    const distributionConfig = getDistributionConfig(
      getStaticAppTemplate({ region, cloudfront: true, acm })
    );

    expect(distributionConfig.ViewerCertificate.AcmCertificateArn).toEqual({
      'Fn::ImportValue': acm,
    });
  });

  /**
   * `aliases` defaults to an empty list, which is truthy, so the
   * `AWS::NoValue` fallback of the template is unreachable and the
   * distribution gets an empty `Aliases`.
   */
  test('should set an empty aliases list when none are defined', () => {
    const distributionConfig = getDistributionConfig(
      getStaticAppTemplate({ region, cloudfront: true, acm: acmArn })
    );

    expect(distributionConfig.Aliases).toEqual([]);
  });

  test('should not set a certificate without acm', () => {
    const distributionConfig = getDistributionConfig(
      getStaticAppTemplate({ region, cloudfront: true })
    );

    expect(distributionConfig).not.toHaveProperty('ViewerCertificate');
  });
});
