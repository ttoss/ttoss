/**
 * Response headers added to the CloudFront distribution.
 *
 * CloudFront applies these natively on the response path via an
 * `AWS::CloudFront::ResponseHeadersPolicy`. No edge function is involved.
 */
export type ResponseHeader = {
  header: string;
  value: string;
  override: boolean;
};

/**
 * The header names emitted by the `SecurityHeadersConfig` of the baseline
 * policy, mapped to the config key that emits them. Each key is optional in
 * `SecurityHeadersConfig`, so a user-defined header of the same name replaces
 * the baseline one by removing the key.
 */
const SECURITY_HEADERS_CONFIG_KEYS: { [header: string]: string } = {
  'content-security-policy': 'ContentSecurityPolicy',
  'referrer-policy': 'ReferrerPolicy',
  'strict-transport-security': 'StrictTransportSecurity',
  'x-content-type-options': 'ContentTypeOptions',
  'x-frame-options': 'FrameOptions',
  'x-xss-protection': 'XSSProtection',
};

/**
 * The header names emitted by the `CorsConfig` of the baseline policy.
 * `CorsConfig` requires its fields as a unit, so a single header cannot be
 * replaced without inventing semantics for the others. Defining one of these
 * is an error instead.
 */
const CORS_CONFIG_HEADERS = [
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-allow-origin',
  'access-control-expose-headers',
  'access-control-max-age',
];

/**
 * https://datatracker.ietf.org/doc/html/rfc7230#section-3.2
 */
const HEADER_NAME_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * Configuration of the managed policy
 * `CORS-with-preflight-and-SecurityHeadersPolicy`
 * (`eaab4381-ed33-4a86-88ca-d9558dc6cd63`), which every static app deploy has
 * used since CloudFront support was added.
 *
 * A custom policy replaces the managed one instead of extending it, so the
 * managed settings are reproduced here to keep deploys that define response
 * headers equivalent to the ones that don't.
 *
 * Transcribed 2026-08-22 from
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html
 *
 * `AccessControlAllowHeaders` is required by CloudFormation but isn't listed
 * on that page. It mirrors the `AllowedHeaders` of the bucket CORS rules.
 *
 * Note the `Override` flags are not uniform: `X-Content-Type-Options` is the
 * only header the managed policy overrides the origin for.
 */
export const BASELINE_RESPONSE_HEADERS_CONFIG = {
  CorsConfig: {
    AccessControlAllowCredentials: false,
    AccessControlAllowHeaders: { Items: ['*'] },
    AccessControlAllowMethods: {
      Items: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    },
    AccessControlAllowOrigins: { Items: ['*'] },
    AccessControlExposeHeaders: { Items: ['*'] },
    OriginOverride: false,
  },
  SecurityHeadersConfig: {
    ReferrerPolicy: {
      Override: false,
      ReferrerPolicy: 'strict-origin-when-cross-origin',
    },
    StrictTransportSecurity: {
      AccessControlMaxAgeSec: 31536000,
      IncludeSubdomains: false,
      Override: false,
      Preload: false,
    },
    ContentTypeOptions: {
      Override: true,
    },
    FrameOptions: {
      FrameOption: 'SAMEORIGIN',
      Override: false,
    },
    XSSProtection: {
      ModeBlock: true,
      Override: false,
      Protection: true,
    },
  },
} as const;

/**
 * The headers of `BASELINE_RESPONSE_HEADERS_CONFIG.CorsConfig` expressed as
 * custom headers.
 *
 * CloudFront's CORS handling owns `Vary`: with a `CorsConfig` in the policy it
 * sends `Vary: Origin` on a plain request and removes `Vary` altogether on a
 * cross-origin one, so a caller-defined `Vary` only survives when the policy
 * has no `CorsConfig`. The baseline allows a static `*`, which nothing varies
 * by, so the same headers can be emitted as custom headers and the caller's
 * `Vary` becomes both true and stable.
 *
 * `Access-Control-Allow-Credentials` is omitted because the baseline sets it
 * to `false`, which is the absence of the header, and `Access-Control-Max-Age`
 * because the baseline doesn't set it.
 */
const CORS_AS_CUSTOM_HEADERS = [
  { header: 'access-control-allow-origin', value: '*' },
  {
    header: 'access-control-allow-methods',
    value: 'DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT',
  },
  { header: 'access-control-allow-headers', value: '*' },
  { header: 'access-control-expose-headers', value: '*' },
];

type ResponseHeadersPolicyConfig = {
  Comment: unknown;
  CorsConfig?: unknown;
  CustomHeadersConfig: {
    Items: { Header: string; Override: boolean; Value: string }[];
  };
  Name: unknown;
  SecurityHeadersConfig?: { [key: string]: unknown };
};

const validateResponseHeaders = (responseHeaders: ResponseHeader[]) => {
  const seen = new Set<string>();

  for (const { header } of responseHeaders) {
    if (!header || !HEADER_NAME_REGEX.test(header)) {
      throw new Error(
        `"${header}" is not a valid HTTP header name for the response-headers option.`
      );
    }

    const headerLowerCase = header.toLowerCase();

    if (seen.has(headerLowerCase)) {
      throw new Error(
        `The response header "${header}" was defined more than once. Header names are case-insensitive.`
      );
    }

    seen.add(headerLowerCase);

    if (CORS_CONFIG_HEADERS.includes(headerLowerCase)) {
      throw new Error(
        `The response header "${header}" is part of the CORS configuration and cannot be defined by the response-headers option. Use the response-headers-policy option to take full control of the policy.`
      );
    }
  }
};

/**
 * Normalizes the `response-headers` option into a list of headers.
 *
 * Accepts the object form, which is the one to prefer:
 *
 * ```ts
 * {
 *  'content-security-policy': "default-src 'self'",
 * }
 * ```
 *
 * And the array form, needed only to set `override` per header:
 *
 * ```ts
 * [
 *  { header: 'content-security-policy', value: "default-src 'self'", override: false },
 * ]
 * ```
 */
export const parseResponseHeaders = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg: any
): ResponseHeader[] => {
  if (!arg) {
    return [];
  }

  const responseHeaders: ResponseHeader[] = Array.isArray(arg)
    ? arg.map(({ header, value, override = true }) => {
        return { header, value, override };
      })
    : Object.entries(arg).map(([header, value]) => {
        return { header, value: String(value), override: true };
      });

  validateResponseHeaders(responseHeaders);

  return responseHeaders;
};

/**
 * Builds the `ResponseHeadersPolicyConfig` of the policy created when the
 * response-headers option is defined: the baseline managed policy settings
 * with the user-defined headers layered on top.
 */
export const getResponseHeadersPolicyConfig = ({
  responseHeaders,
}: {
  responseHeaders: ResponseHeader[];
}): ResponseHeadersPolicyConfig => {
  const securityHeadersConfig: {
    [key: string]: unknown;
  } = { ...BASELINE_RESPONSE_HEADERS_CONFIG.SecurityHeadersConfig };

  /**
   * A user-defined header replaces the baseline one instead of being emitted
   * alongside it.
   */
  for (const { header } of responseHeaders) {
    const securityHeadersConfigKey =
      SECURITY_HEADERS_CONFIG_KEYS[header.toLowerCase()];

    if (securityHeadersConfigKey) {
      delete securityHeadersConfig[securityHeadersConfigKey];
    }
  }

  /**
   * A `CorsConfig` makes CloudFront manage `Vary` itself, which silently
   * discards a user-defined one, so the CORS headers move to
   * `CustomHeadersConfig` when `vary` is defined. The one behavior lost is the
   * automatic `OPTIONS` preflight response of `CorsConfig`; simple
   * cross-origin requests, which is what a static app serves, don't preflight.
   */
  const definesVary = responseHeaders.some(({ header }) => {
    return header.toLowerCase() === 'vary';
  });

  const customHeaders = definesVary
    ? [
        ...responseHeaders,
        ...CORS_AS_CUSTOM_HEADERS.map(({ header, value }) => {
          return { header, override: true, value };
        }),
      ]
    : responseHeaders;

  return {
    Comment: {
      'Fn::Sub': [
        'Response headers policy for ${Project} project.',
        { Project: { Ref: 'Project' } },
      ],
    },
    ...(definesVary
      ? {}
      : { CorsConfig: BASELINE_RESPONSE_HEADERS_CONFIG.CorsConfig }),
    CustomHeadersConfig: {
      Items: customHeaders.map(({ header, value, override }) => {
        return {
          Header: header,
          Override: override,
          Value: value,
        };
      }),
    },
    /**
     * Response headers policy names must be unique per AWS account. Static app
     * deploys are always in us-east-1, so the stack name cannot collide with a
     * same-named stack in another region.
     */
    Name: { Ref: 'AWS::StackName' },
    ...(Object.keys(securityHeadersConfig).length > 0
      ? { SecurityHeadersConfig: securityHeadersConfig }
      : {}),
  };
};
