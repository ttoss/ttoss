import { createAuthTemplate } from '../../src';

test('do not add schema if not provided', () => {
  const template = createAuthTemplate();
  expect(template.Resources.CognitoUserPool.Properties.Schema).toBeUndefined();
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
  (autoVerifiedAttributes: any) => {
    const template = createAuthTemplate({ autoVerifiedAttributes });
    expect(
      template.Resources.CognitoUserPool.Properties.AutoVerifiedAttributes
    ).toEqual([]);
  }
);

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
});
