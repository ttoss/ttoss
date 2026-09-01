import type { CloudFormationTemplate } from '@ttoss/cloudformation';

import type { OAuthConfig } from './template';

const CognitoUserPoolLogicalId = 'CognitoUserPool';
const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';

export type IdentityProviderType = 'Google' | 'Facebook';

export type IdentityProviderConfig = {
  providerType: IdentityProviderType;
  clientId: string;
  clientSecret: string;
  /**
   * Scopes requested from the provider. Defaults to the minimum needed to
   * populate the user pool's `email` attribute.
   */
  scopes?: string[];
  /**
   * Maps provider attributes to user pool attributes. Defaults to
   * `{ email: 'email' }`.
   */
  attributeMapping?: Record<string, string>;
};

const DEFAULT_IDENTITY_PROVIDER_SCOPES: Record<IdentityProviderType, string[]> =
  {
    Google: ['openid', 'email', 'profile'],
    Facebook: ['public_profile', 'email'],
  };

// Cognito forwards `authorize_scopes` to the provider verbatim, and the two
// providers disagree on the separator: Google's OAuth endpoint splits on
// spaces, Facebook's on commas. The wrong separator makes the provider reject
// the whole scope string, not just the extra scopes.
const IDENTITY_PROVIDER_SCOPE_SEPARATOR: Record<IdentityProviderType, string> =
  {
    Google: ' ',
    Facebook: ',',
  };

const DEFAULT_IDENTITY_PROVIDER_ATTRIBUTE_MAPPING = { email: 'email' };

export const identityProviderLogicalId = (
  providerType: IdentityProviderType
) => {
  return `CognitoUserPoolIdentityProvider${providerType}`;
};

export const applyIdentityProviders = (
  template: CloudFormationTemplate,
  identityProviders: IdentityProviderConfig[]
) => {
  for (const provider of identityProviders) {
    const scopes =
      provider.scopes ??
      DEFAULT_IDENTITY_PROVIDER_SCOPES[provider.providerType];

    template.Resources[identityProviderLogicalId(provider.providerType)] = {
      Type: 'AWS::Cognito::UserPoolIdentityProvider',
      Properties: {
        // Cognito requires ProviderName to equal ProviderType for social
        // providers — a custom name is only allowed for OIDC and SAML.
        ProviderName: provider.providerType,
        ProviderType: provider.providerType,
        UserPoolId: { Ref: CognitoUserPoolLogicalId },
        ProviderDetails: {
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          authorize_scopes: scopes.join(
            IDENTITY_PROVIDER_SCOPE_SEPARATOR[provider.providerType]
          ),
        },
        AttributeMapping:
          provider.attributeMapping ??
          DEFAULT_IDENTITY_PROVIDER_ATTRIBUTE_MAPPING,
      },
    };
  }
};

export const applyPrimaryAppClient = (
  template: CloudFormationTemplate,
  {
    oauth,
    identityProviders,
  }: { oauth?: OAuthConfig; identityProviders?: IdentityProviderConfig[] }
) => {
  const client = template.Resources[CognitoUserPoolClientLogicalId];

  if (identityProviders && identityProviders.length > 0) {
    const providerTypes = identityProviders.map((provider) => {
      return provider.providerType;
    });

    client.Properties = {
      ...client.Properties,
      SupportedIdentityProviders: ['COGNITO', ...providerTypes],
    };

    // The client names its providers as strings rather than Refs, so nothing
    // tells CloudFormation to create them first.
    client.DependsOn = providerTypes.map(identityProviderLogicalId);
  }

  if (oauth) {
    client.Properties = {
      ...client.Properties,
      AllowedOAuthFlows: oauth.flows,
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: oauth.scopes,
      CallbackURLs: oauth.callbackUrls,
      ...(oauth.logoutUrls && { LogoutURLs: oauth.logoutUrls }),
    };
  }
};
