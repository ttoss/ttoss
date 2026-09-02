import { createAuthTemplate, identityProviderLogicalId } from '../../src';

describe('identityProviders', () => {
  const google = {
    providerType: 'Google' as const,
    clientId: 'google-client-id',
    clientSecret: 'google-client-secret',
  };

  const facebook = {
    providerType: 'Facebook' as const,
    clientId: 'facebook-client-id',
    clientSecret: 'facebook-client-secret',
  };

  test('should not add identity providers if not provided', () => {
    const template = createAuthTemplate();

    expect(
      template.Resources.CognitoUserPoolIdentityProviderGoogle
    ).toBeUndefined();
    expect(
      template.Resources.CognitoUserPoolClient.Properties
        ?.SupportedIdentityProviders
    ).toEqual(['COGNITO']);
    expect(template.Resources.CognitoUserPoolClient.DependsOn).toBeUndefined();
  });

  test('should throw if identityProviders is set without a domain', () => {
    expect(() => {
      return createAuthTemplate({ identityProviders: [google] });
    }).toThrow('`domain` is required when `identityProviders` is set');
  });

  test('should not throw for an empty identityProviders array', () => {
    expect(() => {
      return createAuthTemplate({ identityProviders: [] });
    }).not.toThrow();
  });

  test('should add a Google identity provider with default scopes and mapping', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      identityProviders: [google],
    });

    expect(template.Resources.CognitoUserPoolIdentityProviderGoogle).toEqual({
      Type: 'AWS::Cognito::UserPoolIdentityProvider',
      Properties: {
        ProviderName: 'Google',
        ProviderType: 'Google',
        UserPoolId: { Ref: 'CognitoUserPool' },
        ProviderDetails: {
          client_id: 'google-client-id',
          client_secret: 'google-client-secret',
          authorize_scopes: 'openid email profile',
        },
        AttributeMapping: { email: 'email' },
      },
    });
  });

  test('should add a Facebook identity provider with comma-separated scopes', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      identityProviders: [facebook],
    });

    expect(
      template.Resources.CognitoUserPoolIdentityProviderFacebook.Properties
        ?.ProviderDetails
    ).toEqual({
      client_id: 'facebook-client-id',
      client_secret: 'facebook-client-secret',
      authorize_scopes: 'public_profile,email',
    });
  });

  test('should override scopes and attribute mapping', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      identityProviders: [
        {
          ...google,
          scopes: ['openid', 'email'],
          attributeMapping: { email: 'email', given_name: 'given_name' },
        },
      ],
    });

    const properties =
      template.Resources.CognitoUserPoolIdentityProviderGoogle.Properties;

    expect(properties?.ProviderDetails.authorize_scopes).toBe('openid email');
    expect(properties?.AttributeMapping).toEqual({
      email: 'email',
      given_name: 'given_name',
    });
  });

  test('should add every provider to the default app client and depend on them', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      identityProviders: [google, facebook],
    });

    expect(
      template.Resources.CognitoUserPoolClient.Properties
        ?.SupportedIdentityProviders
    ).toEqual(['COGNITO', 'Google', 'Facebook']);

    expect(template.Resources.CognitoUserPoolClient.DependsOn).toEqual([
      'CognitoUserPoolIdentityProviderGoogle',
      'CognitoUserPoolIdentityProviderFacebook',
    ]);
  });

  test('should expose the identity provider logical id builder', () => {
    expect(identityProviderLogicalId('Google')).toBe(
      'CognitoUserPoolIdentityProviderGoogle'
    );
  });
});

describe('oauth', () => {
  const oauth = {
    flows: ['code' as const],
    scopes: ['openid', 'email', 'profile'],
    callbackUrls: ['https://app.example.com/'],
  };

  test('should not add OAuth properties to the default app client if not provided', () => {
    const template = createAuthTemplate();

    expect(template.Resources.CognitoUserPoolClient.Properties).toEqual({
      SupportedIdentityProviders: ['COGNITO'],
      UserPoolId: { Ref: 'CognitoUserPool' },
    });
  });

  test('should configure OAuth on the default app client', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      oauth,
    });

    expect(template.Resources.CognitoUserPoolClient.Properties).toEqual({
      SupportedIdentityProviders: ['COGNITO'],
      UserPoolId: { Ref: 'CognitoUserPool' },
      AllowedOAuthFlows: ['code'],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: ['openid', 'email', 'profile'],
      CallbackURLs: ['https://app.example.com/'],
    });
  });

  test('should add logout URLs when provided', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      oauth: { ...oauth, logoutUrls: ['https://app.example.com/auth'] },
    });

    expect(
      template.Resources.CognitoUserPoolClient.Properties?.LogoutURLs
    ).toEqual(['https://app.example.com/auth']);
  });

  test('should add logout URLs to additional app clients', () => {
    const template = createAuthTemplate({
      domain: { domainName: 'my-app' },
      additionalAppClients: [
        {
          name: 'mcp-client',
          oauth: { ...oauth, logoutUrls: ['https://app.example.com/auth'] },
        },
      ],
    });

    expect(
      template.Resources.AppClientMcpClient.Properties?.LogoutURLs
    ).toEqual(['https://app.example.com/auth']);
  });
});
