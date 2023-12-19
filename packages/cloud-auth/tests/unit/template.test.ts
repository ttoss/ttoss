import { createAuthTemplate } from '../../src';

describe('user pool', () => {
  test('do not add schema if not provided', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties.Schema
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
    expect(template.Resources.CognitoUserPool.Properties.Schema).toEqual([
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

  test('should have autoVerifiedAttributes equal email by default', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties.AutoVerifiedAttributes
    ).toEqual(['email']);
  });

  test('default usernameAttributes should be email', () => {
    const template = createAuthTemplate();
    expect(
      template.Resources.CognitoUserPool.Properties.UsernameAttributes
    ).toEqual(['email']);
  });

  test.each([[], null, false])(
    'should have autoVerifiedAttributes undefined: %p',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (autoVerifiedAttributes: any) => {
      const template = createAuthTemplate({ autoVerifiedAttributes });
      expect(
        template.Resources.CognitoUserPool.Properties.AutoVerifiedAttributes
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
});

describe('identity pool', () => {
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
      template.Resources.CognitoIdentityPool.Properties.IdentityPoolName
    ).toEqual(identityPoolName);
  });

  test('should create identity pool authenticated role if authenticatedRoleArn is not defined', () => {
    const template = createAuthTemplate({
      identityPool: {
        enabled: true,
      },
    });

    expect(
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles
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
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles
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
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles
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
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles
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
        .AllowUnauthenticatedIdentities
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
          .AllowUnauthenticatedIdentities
      ).toEqual(allowUnauthenticatedIdentities);
    }
  );
});
