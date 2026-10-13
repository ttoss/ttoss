import { type CloudFormationTemplate } from '@ttoss/cloudformation';
import { addSourceMapsNodeOptions } from 'src/deploy/lambda/addSourceMapsNodeOptions';

const templateWith = (
  resources: CloudFormationTemplate['Resources']
): CloudFormationTemplate => {
  return { AWSTemplateFormatVersion: '2010-09-09', Resources: resources };
};

test('sets NODE_OPTIONS on Lambda and Serverless functions only', () => {
  const template = templateWith({
    Fn: { Type: 'AWS::Lambda::Function', Properties: { Handler: 'a.handler' } },
    SamFn: {
      Type: 'AWS::Serverless::Function',
      Properties: { Handler: 'b.handler' },
    },
    Bucket: { Type: 'AWS::S3::Bucket' },
  });

  addSourceMapsNodeOptions(template);

  expect(
    template.Resources.Fn.Properties?.Environment.Variables.NODE_OPTIONS
  ).toBe('--enable-source-maps');
  expect(
    template.Resources.SamFn.Properties?.Environment.Variables.NODE_OPTIONS
  ).toBe('--enable-source-maps');
  expect(template.Resources.Bucket.Properties).toBeUndefined();
});

test('keeps existing variables and NODE_OPTIONS flags', () => {
  const template = templateWith({
    Fn: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Environment: {
          Variables: { FOO: 'bar', NODE_OPTIONS: '--max-old-space-size=512' },
        },
      },
    },
  });

  addSourceMapsNodeOptions(template);

  expect(template.Resources.Fn.Properties?.Environment.Variables).toEqual({
    FOO: 'bar',
    NODE_OPTIONS: '--max-old-space-size=512 --enable-source-maps',
  });
});

test('does not add the flag twice', () => {
  const template = templateWith({
    Fn: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Environment: { Variables: { NODE_OPTIONS: '--enable-source-maps' } },
      },
    },
  });

  addSourceMapsNodeOptions(template);

  expect(
    template.Resources.Fn.Properties?.Environment.Variables.NODE_OPTIONS
  ).toBe('--enable-source-maps');
});

test('leaves a NODE_OPTIONS set by an intrinsic function untouched', () => {
  const nodeOptions = { Ref: 'NodeOptions' };
  const template = templateWith({
    Fn: {
      Type: 'AWS::Lambda::Function',
      Properties: { Environment: { Variables: { NODE_OPTIONS: nodeOptions } } },
    },
  });

  addSourceMapsNodeOptions(template);

  expect(
    template.Resources.Fn.Properties?.Environment.Variables.NODE_OPTIONS
  ).toBe(nodeOptions);
});
