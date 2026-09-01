import type { CloudFormationTemplate } from '@ttoss/cloudformation';

import { toPascalCase } from './toPascalCase';

const CognitoUserPoolLogicalId = 'CognitoUserPool';

export type DomainConfig = {
  domainName: string;
  certificateArn?: string;
};

export type ResourceServerScope = {
  scopeName: string;
  scopeDescription: string;
};

export type ResourceServerConfig = {
  identifier: string;
  name: string;
  scopes: ResourceServerScope[];
};

export type OAuthConfig = {
  flows: Array<'code' | 'implicit' | 'client_credentials'>;
  scopes: string[];
  callbackUrls: string[];
  logoutUrls?: string[];
};

export type AdditionalAppClientConfig = {
  name: string;
  generateSecret?: boolean;
  oauth?: OAuthConfig;
};

export const applyDomain = (
  template: CloudFormationTemplate,
  domain: DomainConfig
) => {
  template.Resources.CognitoUserPoolDomain = {
    Type: 'AWS::Cognito::UserPoolDomain',
    Properties: {
      Domain: domain.domainName,
      UserPoolId: { Ref: CognitoUserPoolLogicalId },
      ...(domain.certificateArn && {
        CustomDomainConfig: { CertificateArn: domain.certificateArn },
      }),
    },
  };

  const domainUrl = domain.certificateArn
    ? `https://${domain.domainName}`
    : {
        'Fn::Sub': `https://${domain.domainName}.auth.\${AWS::Region}.amazoncognito.com`,
      };

  template.Outputs = {
    ...template.Outputs,
    CognitoUserPoolDomainUrl: {
      Description: 'The Cognito hosted UI domain URL.',
      Value: domainUrl,
      Export: {
        Name: {
          'Fn::Join': [
            ':',
            [{ Ref: 'AWS::StackName' }, 'CognitoUserPoolDomainUrl'],
          ],
        },
      },
    },
  };
};

export const applyResourceServers = (
  template: CloudFormationTemplate,
  resourceServers: ResourceServerConfig[]
) => {
  for (const server of resourceServers) {
    const logicalId = `CognitoUserPoolResourceServer${toPascalCase(server.identifier)}`;

    template.Resources[logicalId] = {
      Type: 'AWS::Cognito::UserPoolResourceServer',
      Properties: {
        Identifier: server.identifier,
        Name: server.name,
        Scopes: server.scopes.map((scope) => {
          return {
            ScopeName: scope.scopeName,
            ScopeDescription: scope.scopeDescription,
          };
        }),
        UserPoolId: { Ref: CognitoUserPoolLogicalId },
      },
    };
  }
};

export const applyAdditionalAppClients = (
  template: CloudFormationTemplate,
  additionalAppClients: AdditionalAppClientConfig[]
) => {
  for (const client of additionalAppClients) {
    const pascalName = toPascalCase(client.name);
    const logicalId = `AppClient${pascalName}`;
    const outputKey = `AppClientId${pascalName}`;

    template.Resources[logicalId] = {
      Type: 'AWS::Cognito::UserPoolClient',
      Properties: {
        ClientName: client.name,
        UserPoolId: { Ref: CognitoUserPoolLogicalId },
        SupportedIdentityProviders: ['COGNITO'],
        GenerateSecret: client.generateSecret ?? false,
        ...(client.oauth && {
          AllowedOAuthFlows: client.oauth.flows,
          AllowedOAuthFlowsUserPoolClient: true,
          AllowedOAuthScopes: client.oauth.scopes,
          CallbackURLs: client.oauth.callbackUrls,
          ...(client.oauth.logoutUrls && {
            LogoutURLs: client.oauth.logoutUrls,
          }),
        }),
      },
    };

    template.Outputs = {
      ...template.Outputs,
      [outputKey]: {
        Description: `App client ID for ${client.name}.`,
        Value: { Ref: logicalId },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, outputKey]],
          },
        },
      },
    };
  }
};
