import {
  dumpToYamlCloudFormationTemplate,
  loadCloudFormationTemplate,
} from '../../src/cloudFormationYamlTemplate';

const yamlTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub \${AWS::StackName}-bucket
      Tags: !If [IsProduction, [], !Ref AWS::NoValue]
Outputs:
  BucketArn:
    Value: !GetAtt Bucket.Arn
    Export:
      Name: !Join ['-', [!Ref AWS::StackName, !ImportValue SharedName]]
`;

const jsonTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: {
    Bucket: {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: { 'Fn::Sub': '${AWS::StackName}-bucket' },
        Tags: { 'Fn::If': ['IsProduction', [], { Ref: 'AWS::NoValue' }] },
      },
    },
  },
  Outputs: {
    BucketArn: {
      Value: { 'Fn::GetAtt': ['Bucket', 'Arn'] },
      Export: {
        Name: {
          'Fn::Join': [
            '-',
            [{ Ref: 'AWS::StackName' }, { 'Fn::ImportValue': 'SharedName' }],
          ],
        },
      },
    },
  },
};

test('should load nested intrinsic function tags', () => {
  expect(loadCloudFormationTemplate(yamlTemplate)).toEqual(jsonTemplate);
});

test('should round-trip a template through dump and load', () => {
  const dumped = dumpToYamlCloudFormationTemplate(jsonTemplate);

  expect(dumped).toContain("AWSTemplateFormatVersion: '2010-09-09'");
  expect(dumped).toContain('Ref: AWS::StackName');
  expect(loadCloudFormationTemplate(dumped)).toEqual(jsonTemplate);
});

test('should keep unquoted dates as strings', () => {
  expect(
    loadCloudFormationTemplate('AWSTemplateFormatVersion: 2010-09-09')
  ).toEqual({ AWSTemplateFormatVersion: '2010-09-09' });
});

test('should support merge keys', () => {
  const template = `
Defaults: &defaults
  Runtime: nodejs24.x
  Timeout: 30
Function:
  <<: *defaults
  Timeout: 60
`;

  expect(loadCloudFormationTemplate(template)).toMatchObject({
    Function: { Runtime: 'nodejs24.x', Timeout: 60 },
  });
});

test('should load custom tags', () => {
  expect(
    loadCloudFormationTemplate('Value: !Upper text\nList: !Count [a, b]', [
      {
        tag: '!Upper',
        options: {
          kind: 'scalar',
          construct: (data: string) => {
            return data.toUpperCase();
          },
        },
      },
      {
        tag: '!Count',
        options: {
          kind: 'sequence',
          construct: (data: string[]) => {
            return data.length;
          },
        },
      },
    ])
  ).toEqual({ Value: 'TEXT', List: 2 });
});
