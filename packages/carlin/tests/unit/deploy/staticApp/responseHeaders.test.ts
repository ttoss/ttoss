import {
  BASELINE_RESPONSE_HEADERS_CONFIG,
  getResponseHeadersPolicyConfig,
  parseResponseHeaders,
} from 'src/deploy/staticApp/responseHeaders';

describe('parseResponseHeaders', () => {
  test.each([[undefined], [null], [[]], [{}]])(
    'should return an empty list for %p',
    (arg) => {
      expect(parseResponseHeaders(arg)).toEqual([]);
    }
  );

  test('should parse the object form and override the origin by default', () => {
    expect(
      parseResponseHeaders({
        'content-security-policy': "default-src 'self'",
        'permissions-policy': 'geolocation=()',
      })
    ).toEqual([
      {
        header: 'content-security-policy',
        override: true,
        value: "default-src 'self'",
      },
      {
        header: 'permissions-policy',
        override: true,
        value: 'geolocation=()',
      },
    ]);
  });

  test('should parse the array form keeping the defined override', () => {
    expect(
      parseResponseHeaders([
        { header: 'x-custom', override: false, value: 'some-value' },
        { header: 'x-other', value: 'other-value' },
      ])
    ).toEqual([
      { header: 'x-custom', override: false, value: 'some-value' },
      { header: 'x-other', override: true, value: 'other-value' },
    ]);
  });

  test.each([['invalid header'], ['invalid:header'], ['']])(
    'should throw for the invalid header name %p',
    (header) => {
      expect(() => {
        return parseResponseHeaders({ [header]: 'some-value' });
      }).toThrow('is not a valid HTTP header name');
    }
  );

  test('should throw when the same header is defined twice', () => {
    expect(() => {
      return parseResponseHeaders([
        { header: 'X-Custom', value: 'some-value' },
        { header: 'x-custom', value: 'other-value' },
      ]);
    }).toThrow('was defined more than once');
  });

  /**
   * CorsConfig requires its fields as a unit, so a single CORS header cannot
   * be replaced without inventing semantics for the others.
   */
  test.each([
    ['access-control-allow-origin'],
    ['Access-Control-Allow-Methods'],
    ['access-control-max-age'],
  ])('should throw for the CORS header %p', (header) => {
    expect(() => {
      return parseResponseHeaders({ [header]: '*' });
    }).toThrow('response-headers-policy');
  });
});

describe('getResponseHeadersPolicyConfig', () => {
  test('should keep the baseline settings of the managed policy', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({ 'x-custom': 'some-value' }),
    });

    expect(config.CorsConfig).toEqual(
      BASELINE_RESPONSE_HEADERS_CONFIG.CorsConfig
    );
    expect(config.SecurityHeadersConfig).toEqual(
      BASELINE_RESPONSE_HEADERS_CONFIG.SecurityHeadersConfig
    );
    expect(config.Name).toEqual({ Ref: 'AWS::StackName' });
    expect(config.CustomHeadersConfig).toEqual({
      Items: [{ Header: 'x-custom', Override: true, Value: 'some-value' }],
    });
  });

  /**
   * The managed policy overrides the origin only for X-Content-Type-Options.
   */
  test('should keep the override flags of the managed policy', () => {
    const { SecurityHeadersConfig } = BASELINE_RESPONSE_HEADERS_CONFIG;

    expect(SecurityHeadersConfig.ContentTypeOptions.Override).toBe(true);
    expect(SecurityHeadersConfig.FrameOptions.Override).toBe(false);
    expect(SecurityHeadersConfig.ReferrerPolicy.Override).toBe(false);
    expect(SecurityHeadersConfig.StrictTransportSecurity.Override).toBe(false);
    expect(SecurityHeadersConfig.XSSProtection.Override).toBe(false);
  });

  test.each([
    ['content-security-policy', 'ContentSecurityPolicy'],
    ['referrer-policy', 'ReferrerPolicy'],
    ['Strict-Transport-Security', 'StrictTransportSecurity'],
    ['x-content-type-options', 'ContentTypeOptions'],
    ['X-Frame-Options', 'FrameOptions'],
    ['x-xss-protection', 'XSSProtection'],
  ])(
    'should drop the baseline %p so the defined header is the only one sent',
    (header, securityHeadersConfigKey) => {
      const config = getResponseHeadersPolicyConfig({
        responseHeaders: parseResponseHeaders({ [header]: 'some-value' }),
      });

      expect(config.SecurityHeadersConfig).not.toHaveProperty(
        securityHeadersConfigKey
      );

      expect(config.CustomHeadersConfig.Items).toEqual([
        { Header: header, Override: true, Value: 'some-value' },
      ]);
    }
  );

  /**
   * CloudFront's CORS handling owns Vary, so a user-defined one only reaches
   * the viewer when the policy has no CorsConfig. The CORS headers then come
   * from the bucket, which the static app template configures for CORS.
   */
  test('should drop CorsConfig when vary is defined', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({ vary: 'Accept' }),
    });

    expect(config).not.toHaveProperty('CorsConfig');

    expect(config.CustomHeadersConfig.Items).toEqual([
      { Header: 'vary', Override: true, Value: 'Accept' },
    ]);
  });

  /**
   * CloudFront rejects a policy whose CustomHeadersConfig names a header it
   * manages itself, so synthesizing the CORS headers there fails the deploy
   * with a 400 rather than replacing CorsConfig.
   */
  test.each([[{ vary: 'Accept' }], [{ 'x-custom': 'some-value' }]])(
    'should never put a CORS header in CustomHeadersConfig for %p',
    (responseHeaders) => {
      const config = getResponseHeadersPolicyConfig({
        responseHeaders: parseResponseHeaders(responseHeaders),
      });

      const corsHeaders = config.CustomHeadersConfig.Items.filter(
        ({ Header }) => {
          return Header.toLowerCase().startsWith('access-control-');
        }
      );

      expect(corsHeaders).toEqual([]);
    }
  );

  test('should match vary case-insensitively', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({ Vary: 'Accept' }),
    });

    expect(config).not.toHaveProperty('CorsConfig');
  });

  /**
   * The regression guard for every deploy that doesn't define vary.
   */
  test('should keep CorsConfig when vary is not defined', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({ 'x-robots-tag': 'noindex' }),
    });

    expect(config.CorsConfig).toEqual(
      BASELINE_RESPONSE_HEADERS_CONFIG.CorsConfig
    );

    expect(config.CustomHeadersConfig.Items).toEqual([
      { Header: 'x-robots-tag', Override: true, Value: 'noindex' },
    ]);
  });

  test('should keep the security headers when vary is defined', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({ vary: 'Accept' }),
    });

    expect(config.SecurityHeadersConfig).toEqual(
      BASELINE_RESPONSE_HEADERS_CONFIG.SecurityHeadersConfig
    );
  });

  test('should keep the defined override of a vary in the array form', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders([
        { header: 'vary', override: false, value: 'Accept' },
      ]),
    });

    expect(config.CustomHeadersConfig.Items[0]).toEqual({
      Header: 'vary',
      Override: false,
      Value: 'Accept',
    });
  });

  test('should not add SecurityHeadersConfig when every baseline header is replaced', () => {
    const config = getResponseHeadersPolicyConfig({
      responseHeaders: parseResponseHeaders({
        'referrer-policy': 'no-referrer',
        'strict-transport-security': 'max-age=63072000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '0',
      }),
    });

    expect(config).not.toHaveProperty('SecurityHeadersConfig');
  });
});
