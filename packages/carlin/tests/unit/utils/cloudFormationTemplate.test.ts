import {
  dumpToYamlCloudFormationTemplate,
  loadCloudFormationTemplate,
} from './cloudFormationTemplate';

test('method dumpToYamlCloudFormationTemplate', () => {
  const jsonTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      Resource1: {
        Type: 'Type',
        Properties: { Ref: 'SomeRef' },
      },
    },
  } as const;

  const yamlTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Resources:
  Resource1:
    Type: Type
    Properties:
      Ref: SomeRef
`;

  expect(dumpToYamlCloudFormationTemplate(jsonTemplate)).toEqual(yamlTemplate);
});

test('method loadCloudFormationTemplate', () => {
  const yamlTemplate = `
  AWSTemplateFormatVersion: '2010-09-09'
  Resources:
    Resource1:
      Type: Type
      Properties:
        Equals: !Equals [SomeEquals]
        FindInMap: !FindInMap [Find, In, Map]
        GetAttScalar: !GetAtt Get.Att
        GetAttSequence: !GetAtt [Get, Att]
        If: !If [Some, If]
        ImportValue: !ImportValue SomeValue
        Join: !Join [Some, Join]
        Not: !Not [Some, Not]
        Ref: !Ref SomeRef
        SubScalar: !Sub SomeSub
        SubSequence: !Sub [Some, Sub]
      `;

  expect(loadCloudFormationTemplate(yamlTemplate)).toEqual({
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      Resource1: {
        Type: 'Type',
        Properties: {
          Equals: { 'Fn::Equals': ['SomeEquals'] },
          FindInMap: { 'Fn::FindInMap': ['Find', 'In', 'Map'] },
          GetAttScalar: { 'Fn::GetAtt': ['Get', 'Att'] },
          GetAttSequence: { 'Fn::GetAtt': ['Get', 'Att'] },
          If: { 'Fn::If': ['Some', 'If'] },
          ImportValue: { 'Fn::ImportValue': 'SomeValue' },
          Join: { 'Fn::Join': ['Some', 'Join'] },
          Not: { 'Fn::Not': ['Some', 'Not'] },
          Ref: { Ref: 'SomeRef' },
          SubScalar: { 'Fn::Sub': 'SomeSub' },
          SubSequence: { 'Fn::Sub': ['Some', 'Sub'] },
        },
      },
    },
  });
});
