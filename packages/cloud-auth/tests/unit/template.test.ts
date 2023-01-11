import { createAuthTemplate } from '../../src';

test('do not add schema if not provided', () => {
  const template = createAuthTemplate();
  expect(template.Resources.CognitoUserPool.Properties.Schema).toBeUndefined();
});

test('add schema if provided', () => {
  const schema = [
    {
      AttributeDataType: 'String' as const,
      DeveloperOnlyAttribute: false,
      Mutable: true,
      Name: 'email',
      Required: true,
      StringAttributeConstraints: {
        MaxLength: '2048',
        MinLength: '0',
      },
    },
  ];

  const template = createAuthTemplate({ schema });
  expect(template.Resources.CognitoUserPool.Properties.Schema).toEqual(schema);
});

test('should have autoVerifiedAttributes equal email by default', () => {
  const template = createAuthTemplate();
  expect(
    template.Resources.CognitoUserPool.Properties.AutoVerifiedAttributes
  ).toEqual(['email']);
});

test.each([[], null, false])(
  'should have autoVerifiedAttributes undefined: %p',
  (autoVerifiedAttributes: any) => {
    const template = createAuthTemplate({ autoVerifiedAttributes });
    expect(
      template.Resources.CognitoUserPool.Properties.AutoVerifiedAttributes
    ).toBeUndefined();
  }
);

test.each([true, undefined])(
  'should have identity pool by default or true: %p',
  (identityPool) => {
    const template = createAuthTemplate({ identityPool });
    expect(template.Resources.CognitoIdentityPool).toBeDefined();
    expect(template.Outputs?.IdentityPoolId).toBeDefined();
  }
);

test('should not have identity pool if false', () => {
  const template = createAuthTemplate({ identityPool: false });
  expect(template.Resources.CognitoIdentityPool).toBeUndefined();
  expect(template.Outputs?.IdentityPoolId).toBeUndefined();
});

test('should have identity pool with roles', () => {
  const roles = {
    authenticated: 'arn:aws:iam::123456789012:role/authenticated',
    unauthenticated: 'arn:aws:iam::123456789012:role/unauthenticated',
  };
  const template = createAuthTemplate({ roles });
  expect(
    template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles
  ).toEqual(roles);
});
