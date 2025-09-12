import { createAuthTemplate } from '../../src';
import { defaultPrincipalTags } from '../../src/template';

describe('user pool', () => {
  test('do not add schema if not provided', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties?.Schema
    ).toBeUndefined();
  });

  test('add schema if provided', () => {
    const schema = [
      {
        attributeDataType: 'String' as const,
        developerOnlyAttribute: false,
        mutable: true,
        name: 'email',
        required: true,
        stringAttributeConstraints: {
          maxLength: '2048',
          minLength: '0',
        },
      },
    ];

    const template = createAuthTemplate({ schema });
    expect(template.Resources.CognitoUserPool.Properties?.Schema).toEqual([
      {
        AttributeDataType: 'String',
        DeveloperOnlyAttribute: false,
        Mutable: true,
        Name: 'email',
        Required: true,
        StringAttributeConstraints: {
          MaxLength: '2048',
          MinLength: '0',
        },
      },
    ]);
  });

  test('add schema with numberAttributeConstraints if provided', () => {
    const schema = [
      {
        attributeDataType: 'Number' as const,
        developerOnlyAttribute: false,
        mutable: true,
        name: 'age',
        required: false,
        numberAttributeConstraints: {
          maxValue: '120',
          minValue: '0',
        },
      },
    ];

    const template = createAuthTemplate({ schema });
    expect(template.Resources.CognitoUserPool.Properties?.Schema).toEqual([
      {
        AttributeDataType: 'Number',
        DeveloperOnlyAttribute: false,
        Mutable: true,
        Name: 'age',
        Required: false,
        NumberAttributeConstraints: {
          MaxValue: '120',
          MinValue: '0',
        },
      },
    ]);
  });

  test('schema without constraints should not include constraint properties', () => {
    const schema = [
      {
        attributeDataType: 'Boolean' as const,
        name: 'isActive',
        required: false,
      },
    ];

    const template = createAuthTemplate({ schema });
    expect(template.Resources.CognitoUserPool.Properties?.Schema).toEqual([
      {
        AttributeDataType: 'Boolean',
        Name: 'isActive',
        Required: false,
        DeveloperOnlyAttribute: undefined,
        Mutable: undefined,
        NumberAttributeConstraints: undefined,
        StringAttributeConstraints: undefined,
      },
    ]);
  });

  test('should have autoVerifiedAttributes equal email by default', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties?.AutoVerifiedAttributes
    ).toEqual(['email']);
  });

  test('default usernameAttributes should be email', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties?.UsernameAttributes
    ).toEqual(['email']);
  });

  test.each([[], null, false])(
    'should have autoVerifiedAttributes undefined: %p',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (autoVerifiedAttributes: any) => {
      const template = createAuthTemplate({ autoVerifiedAttributes });
      expect(
        template.Resources.CognitoUserPool.Properties?.AutoVerifiedAttributes
      ).toEqual([]);
    }
  );

  /**
   * It should be undefined because carlin deploy will handle its value.
   * See https://github.com/ttoss/ttoss/pull/312
   */
  test('retain user pool should be undefined', () => {
    const template = createAuthTemplate();
    expect(template.Resources.CognitoUserPool.DeletionPolicy).toBeUndefined();
  });

  test('should not add DeletionProtection if not provided', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties?.DeletionProtection
    ).toBeUndefined();
  });

  test.each(['ACTIVE', 'INACTIVE'] as const)(
    'should add DeletionProtection when provided: %s',
    (deletionProtection) => {
      const template = createAuthTemplate({ deletionProtection });
      expect(
        template.Resources.CognitoUserPool.Properties?.DeletionProtection
      ).toEqual(deletionProtection);
    }
  );
});

describe('identity pool', () => {
  test.each([
    {
      principalTags: undefined,
    },
    {
      principalTags: true,
    },
  ])(
    'should map principal tags by default or if principalTags is true',
    ({ principalTags }) => {
      const template = createAuthTemplate({
        identityPool: {
          enabled: true,
          principalTags,
        },
      });

      expect(template.Resources.CognitoIdentityPoolPrincipalTag).toEqual({
        Type: 'AWS::Cognito::IdentityPoolPrincipalTag',
        Properties: {
          IdentityPoolId: {
            Ref: createAuthTemplate.CognitoIdentityPoolLogicalId,
          },
          IdentityProviderName: {
            'Fn::GetAtt': [
              createAuthTemplate.CognitoUserPoolLogicalId,
              'ProviderName',
            ],
          },
          PrincipalTags: defaultPrincipalTags,
          UseDefaults: false,
        },
      });
    }
  );

  test('should not map principal tags if principalTags is false', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
        principalTags: false,
      },
    });

    expect(template.Resources.CognitoIdentityPoolPrincipalTag).toBeUndefined();
  });

  test('should map custom principal tags if provided', () => {
    const principalTags = {
      customTag: 'customValue',
    };

    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
        principalTags,
      },
    });

    expect(template.Resources.CognitoIdentityPoolPrincipalTag).toEqual({
      Type: 'AWS::Cognito::IdentityPoolPrincipalTag',
      Properties: {
        IdentityPoolId: {
          Ref: createAuthTemplate.CognitoIdentityPoolLogicalId,
        },
        IdentityProviderName: {
          'Fn::GetAtt': [
            createAuthTemplate.CognitoUserPoolLogicalId,
            'ProviderName',
          ],
        },
        PrincipalTags: principalTags,
        UseDefaults: false,
      },
    });
  });

  test.each([false, undefined])(
    'should not have identity pool by default or false: %p',
    (enabled) => {
      const template = createAuthTemplate({ identityPool: { enabled } });
      expect(template.Resources.CognitoIdentityPool).not.toBeDefined();
      expect(template.Outputs?.IdentityPoolId).not.toBeDefined();
    }
  );

  test('should have identity pool if false', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });
    expect(template.Resources.CognitoIdentityPool).toBeDefined();
    expect(template.Outputs?.IdentityPoolId).toBeDefined();
  });

  test('should have identity pool role attachment', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });
    expect(template.Resources.CognitoIdentityPoolRoleAttachment).toBeDefined();
  });

  test('should set identity pool name if provided', () => {
    const identityPoolName = 'identity-pool-name';

    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
        name: identityPoolName,
      },
    });

    expect(
      template.Resources.CognitoIdentityPool.Properties?.IdentityPoolName
    ).toEqual(identityPoolName);
  });

  test('should create identity pool authenticated role if authenticatedRoleArn is not defined', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });

    expect(
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties?.Roles
        .authenticated
    ).toEqual({
      'Fn::GetAtt': [
        createAuthTemplate.IdentityPoolAuthenticatedIAMRoleLogicalId,
        'Arn',
      ],
    });
  });

  test('should create identity pool unauthenticated role if unauthenticatedRoleArn is not defined', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });

    expect(
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties?.Roles
        .unauthenticated
    ).toEqual({
      'Fn::GetAtt': [
        createAuthTemplate.IdentityPoolUnauthenticatedIAMRoleLogicalId,
        'Arn',
      ],
    });
  });

  test('should set authenticatedRoleArn if provided', () => {
    const authenticatedRoleArn = 'arn:aws:iam::123456789012:role/AuthRole';

    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
        authenticatedRoleArn,
      },
    });

    expect(
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties?.Roles
        .authenticated
    ).toEqual(authenticatedRoleArn);
  });

  test('should set unauthenticatedRoleArn if provided', () => {
    const unauthenticatedRoleArn = 'arn:aws:iam::123456789012:role/UnauthRole';

    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
        unauthenticatedRoleArn,
      },
    });

    expect(
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties?.Roles
        .unauthenticated
    ).toEqual(unauthenticatedRoleArn);
  });

  test("don't allow unauthenticated identities by default", () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });

    expect(
      template.Resources.CognitoIdentityPool.Properties
        ?.AllowUnauthenticatedIdentities
    ).toEqual(false);
  });

  test.each([true, false])(
    'should allow unauthenticated identities if provided: %p',
    (allowUnauthenticatedIdentities) => {
      const template = createAuthTemplate({
        identityPool: {
          enabled: true,
          allowUnauthenticatedIdentities,
        },
      });

      expect(
        template.Resources.CognitoIdentityPool.Properties
          ?.AllowUnauthenticatedIdentities
      ).toEqual(allowUnauthenticatedIdentities);
    }
  );
});

describe('lambda triggers', () => {
  test('should not add LambdaConfig if no lambda triggers provided', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties?.LambdaConfig
    ).toBeUndefined();
  });

  test('should not add LambdaConfig if empty lambda triggers object provided', () => {
    const template = createAuthTemplate({
      lambdaTriggers: {},
    });
    expect(
      template.Resources.CognitoUserPool.Properties?.LambdaConfig
    ).toBeUndefined();
  });

  test('should add single lambda trigger', () => {
    const template = createAuthTemplate({
      lambdaTriggers: {
        preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
      },
    });
    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        PreSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
      }
    );
  });

  test('should add multiple lambda triggers', () => {
    const template = createAuthTemplate({
      lambdaTriggers: {
        preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        postConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
        preAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PreAuth',
      },
    });
    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        PreSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        PostConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
        PreAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PreAuth',
      }
    );
  });

  test('should handle CloudFormation Ref intrinsic functions', () => {
    const template = createAuthTemplate({
      lambdaTriggers: {
        preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        postConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
      },
    });
    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        PreSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        PostConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
      }
    );
  });

  test('should handle CloudFormation GetAtt intrinsic functions', () => {
    const template = createAuthTemplate({
      lambdaTriggers: {
        preTokenGeneration: { 'Fn::GetAtt': ['PreTokenFunction', 'Arn'] },
        userMigration: { 'Fn::GetAtt': ['UserMigrationFunction', 'Arn'] },
      },
    });
    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        PreTokenGeneration: { 'Fn::GetAtt': ['PreTokenFunction', 'Arn'] },
        UserMigration: { 'Fn::GetAtt': ['UserMigrationFunction', 'Arn'] },
      }
    );
  });

  test.each([
    ['preSignUp', 'PreSignUp'],
    ['postConfirmation', 'PostConfirmation'],
    ['preAuthentication', 'PreAuthentication'],
    ['postAuthentication', 'PostAuthentication'],
    ['defineAuthChallenge', 'DefineAuthChallenge'],
    ['createAuthChallenge', 'CreateAuthChallenge'],
    ['verifyAuthChallengeResponse', 'VerifyAuthChallengeResponse'],
    ['preTokenGeneration', 'PreTokenGeneration'],
    ['userMigration', 'UserMigration'],
    ['customMessage', 'CustomMessage'],
    ['customEmailSender', 'CustomEmailSender'],
    ['customSMSSender', 'CustomSMSSender'],
  ])('should map %s to %s in LambdaConfig', (inputKey, outputKey) => {
    const lambdaTriggers = {
      [inputKey]: 'arn:aws:lambda:us-east-1:123456789012:function:TestFunction',
    };

    const template = createAuthTemplate({ lambdaTriggers });

    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        [outputKey]:
          'arn:aws:lambda:us-east-1:123456789012:function:TestFunction',
      }
    );
  });

  test('should add all lambda triggers when provided', () => {
    const allTriggers = {
      preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
      postConfirmation:
        'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
      preAuthentication:
        'arn:aws:lambda:us-east-1:123456789012:function:PreAuthentication',
      postAuthentication:
        'arn:aws:lambda:us-east-1:123456789012:function:PostAuthentication',
      defineAuthChallenge:
        'arn:aws:lambda:us-east-1:123456789012:function:DefineAuthChallenge',
      createAuthChallenge:
        'arn:aws:lambda:us-east-1:123456789012:function:CreateAuthChallenge',
      verifyAuthChallengeResponse:
        'arn:aws:lambda:us-east-1:123456789012:function:VerifyAuthChallengeResponse',
      preTokenGeneration:
        'arn:aws:lambda:us-east-1:123456789012:function:PreTokenGeneration',
      userMigration:
        'arn:aws:lambda:us-east-1:123456789012:function:UserMigration',
      customMessage:
        'arn:aws:lambda:us-east-1:123456789012:function:CustomMessage',
      customEmailSender:
        'arn:aws:lambda:us-east-1:123456789012:function:CustomEmailSender',
      customSMSSender:
        'arn:aws:lambda:us-east-1:123456789012:function:CustomSMSSender',
    };

    const template = createAuthTemplate({
      lambdaTriggers: allTriggers,
    });

    expect(template.Resources.CognitoUserPool.Properties?.LambdaConfig).toEqual(
      {
        PreSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        PostConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
        PreAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PreAuthentication',
        PostAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PostAuthentication',
        DefineAuthChallenge:
          'arn:aws:lambda:us-east-1:123456789012:function:DefineAuthChallenge',
        CreateAuthChallenge:
          'arn:aws:lambda:us-east-1:123456789012:function:CreateAuthChallenge',
        VerifyAuthChallengeResponse:
          'arn:aws:lambda:us-east-1:123456789012:function:VerifyAuthChallengeResponse',
        PreTokenGeneration:
          'arn:aws:lambda:us-east-1:123456789012:function:PreTokenGeneration',
        UserMigration:
          'arn:aws:lambda:us-east-1:123456789012:function:UserMigration',
        CustomMessage:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomMessage',
        CustomEmailSender:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomEmailSender',
        CustomSMSSender:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomSMSSender',
      }
    );
  });

  describe('AWS Lambda Permissions', () => {
    test('should create Lambda permission for single trigger', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        },
      });

      const permissionKey = 'PreSignUpPermissionForCognitoUserPool';
      expect(template.Resources[permissionKey]).toEqual({
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName:
            'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
          Principal: 'cognito-idp.amazonaws.com',
          SourceArn: {
            'Fn::GetAtt': ['CognitoUserPool', 'Arn'],
          },
        },
      });
    });

    test('should create Lambda permissions for multiple triggers', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
          postConfirmation:
            'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
        },
      });

      const preSignUpPermissionKey = 'PreSignUpPermissionForCognitoUserPool';
      const postConfirmationPermissionKey =
        'PostConfirmationPermissionForCognitoUserPool';

      expect(template.Resources[preSignUpPermissionKey]).toBeDefined();
      expect(template.Resources[postConfirmationPermissionKey]).toBeDefined();

      expect(template.Resources[preSignUpPermissionKey].Type).toBe(
        'AWS::Lambda::Permission'
      );
      expect(template.Resources[postConfirmationPermissionKey].Type).toBe(
        'AWS::Lambda::Permission'
      );
    });

    test('should create Lambda permission for CloudFormation GetAtt reference', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          preTokenGeneration: { 'Fn::GetAtt': ['PreTokenFunction', 'Arn'] },
        },
      });

      const permissionKey = 'PreTokenGenerationPermissionForCognitoUserPool';
      expect(template.Resources[permissionKey]).toEqual({
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: { 'Fn::GetAtt': ['PreTokenFunction', 'Arn'] },
          Principal: 'cognito-idp.amazonaws.com',
          SourceArn: {
            'Fn::GetAtt': ['CognitoUserPool', 'Arn'],
          },
        },
      });
    });

    test('should handle function names with special characters in permission logical ID', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          customMessage:
            'arn:aws:lambda:us-east-1:123456789012:function:my-custom-message_function',
        },
      });

      const permissionKey = 'CustomMessagePermissionForCognitoUserPool';
      expect(template.Resources[permissionKey]).toBeDefined();
      expect(template.Resources[permissionKey].Type).toBe(
        'AWS::Lambda::Permission'
      );
      expect(template.Resources[permissionKey].Properties?.FunctionName).toBe(
        'arn:aws:lambda:us-east-1:123456789012:function:my-custom-message_function'
      );
    });

    test('should create permissions for all supported lambda trigger types', () => {
      const allTriggers = {
        preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
        postConfirmation:
          'arn:aws:lambda:us-east-1:123456789012:function:PostConfirmation',
        preAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PreAuthentication',
        postAuthentication:
          'arn:aws:lambda:us-east-1:123456789012:function:PostAuthentication',
        defineAuthChallenge:
          'arn:aws:lambda:us-east-1:123456789012:function:DefineAuthChallenge',
        createAuthChallenge:
          'arn:aws:lambda:us-east-1:123456789012:function:CreateAuthChallenge',
        verifyAuthChallengeResponse:
          'arn:aws:lambda:us-east-1:123456789012:function:VerifyAuthChallengeResponse',
        preTokenGeneration:
          'arn:aws:lambda:us-east-1:123456789012:function:PreTokenGeneration',
        userMigration:
          'arn:aws:lambda:us-east-1:123456789012:function:UserMigration',
        customMessage:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomMessage',
        customEmailSender:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomEmailSender',
        customSMSSender:
          'arn:aws:lambda:us-east-1:123456789012:function:CustomSMSSender',
      };

      const template = createAuthTemplate({
        lambdaTriggers: allTriggers,
      });

      // Count permission resources
      const permissionResources = Object.keys(template.Resources).filter(
        (key) => {
          return template.Resources[key].Type === 'AWS::Lambda::Permission';
        }
      );

      expect(permissionResources).toHaveLength(12);

      // Check that all permissions have correct properties
      for (const key of permissionResources) {
        const permission = template.Resources[key];
        expect(permission.Properties?.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties?.Principal).toBe(
          'cognito-idp.amazonaws.com'
        );
        expect(permission.Properties?.SourceArn).toEqual({
          'Fn::GetAtt': ['CognitoUserPool', 'Arn'],
        });
        expect(permission.Properties?.FunctionName).toBeDefined();
      }
    });

    test('should not create Lambda permissions when no triggers provided', () => {
      const template = createAuthTemplate();

      const permissionResources = Object.keys(template.Resources).filter(
        (key) => {
          return template.Resources[key].Type === 'AWS::Lambda::Permission';
        }
      );

      expect(permissionResources).toHaveLength(0);
    });

    test('should not create Lambda permissions for empty triggers object', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {},
      });

      const permissionResources = Object.keys(template.Resources).filter(
        (key) => {
          return template.Resources[key].Type === 'AWS::Lambda::Permission';
        }
      );

      expect(permissionResources).toHaveLength(0);
    });

    test('should handle mixed string and CloudFormation reference triggers', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          preSignUp: 'arn:aws:lambda:us-east-1:123456789012:function:PreSignUp',
          postConfirmation: {
            'Fn::GetAtt': ['PostConfirmationFunction', 'Arn'],
          },
          customMessage:
            'arn:aws:lambda:us-east-1:123456789012:function:CustomMessage',
        },
      });

      const permissionResources = Object.keys(template.Resources).filter(
        (key) => {
          return template.Resources[key].Type === 'AWS::Lambda::Permission';
        }
      );

      expect(permissionResources).toHaveLength(3);

      // Check specific permissions exist
      const preSignUpKey = 'PreSignUpPermissionForCognitoUserPool';
      const postConfirmationKey =
        'PostConfirmationPermissionForCognitoUserPool';
      const customMessageKey = 'CustomMessagePermissionForCognitoUserPool';

      expect(template.Resources[preSignUpKey]).toBeDefined();
      expect(template.Resources[postConfirmationKey]).toBeDefined();
      expect(template.Resources[customMessageKey]).toBeDefined();
    });

    test('trigger is not string neither getAtt', () => {
      const template = createAuthTemplate({
        lambdaTriggers: {
          preSignUp: { Ref: 'PreSignUpFunction' } as unknown as string,
          postConfirmation: {
            'Fn::GetAtt': 'arn',
          } as unknown as string,
        },
      });

      const permissionResources = Object.keys(template.Resources).filter(
        (key) => {
          return template.Resources[key].Type === 'AWS::Lambda::Permission';
        }
      );

      expect(permissionResources).toHaveLength(0);
    });
  });
});
