jest.mock('fs', () => {
  return {
    readFileSync: jest.fn(),
  };
});

import * as fs from 'fs';
import { faker } from '@ttoss/test-utils/faker';
import { readCloudFormationYamlTemplate } from '../../src/readCloudFormationYamlTemplate';

const subStringPath = 'some-path';

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
      SubString: !SubString ${subStringPath}
    `;

const templatePath = faker.random.word();

const templatePathToReturnUndefined = `${templatePath}${faker.random.word()}`;

const defaultStringReturned = faker.random.word();

beforeAll(() => {
  (fs.readFileSync as jest.Mock).mockImplementation((t: string) => {
    if (t === templatePath) {
      return yamlTemplate;
    }

    if (t === templatePathToReturnUndefined) {
      return undefined;
    }

    return defaultStringReturned;
  });
});

test('should read cloudformation template file', () => {
  expect(readCloudFormationYamlTemplate({ templatePath })).toEqual({
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
          SubString: defaultStringReturned,
        },
      },
    },
  });

  /**
   * The second fsReadFileSync call is the SubString.
   */
  expect(fs.readFileSync).toHaveBeenNthCalledWith(
    2,
    expect.stringMatching(`/${subStringPath}`)
  );
});

test('cannot parse because template', () => {
  expect(() => {
    return readCloudFormationYamlTemplate({
      templatePath: templatePathToReturnUndefined,
    });
  }).toThrow();

  expect(() => {
    return readCloudFormationYamlTemplate({
      templatePath: `${defaultStringReturned}string`,
    });
  }).toThrow();
});
