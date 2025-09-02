/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CloudFormationTemplate } from '@ttoss/cloudformation';
import yaml from 'js-yaml';

export interface TagAndType {
  tag: string;
  options: yaml.TypeConstructorOptions;
}

const cloudFormationTypes: TagAndType[] = [
  {
    tag: '!Equals',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::Equals': data };
      },
    },
  },
  {
    tag: '!FindInMap',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::FindInMap': data };
      },
    },
  },
  {
    tag: '!GetAtt',
    options: {
      kind: 'scalar',
      construct: (data: any) => {
        return { 'Fn::GetAtt': data.split('.') };
      },
    },
  },
  {
    tag: '!GetAtt',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::GetAtt': data };
      },
    },
  },
  {
    tag: '!If',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::If': data };
      },
    },
  },
  {
    tag: '!ImportValue',
    options: {
      kind: 'scalar',
      construct: (data: any) => {
        return { 'Fn::ImportValue': data };
      },
    },
  },
  {
    tag: '!Join',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::Join': data };
      },
    },
  },
  {
    tag: '!Not',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::Not': data };
      },
    },
  },
  {
    tag: '!Ref',
    options: {
      kind: 'scalar',
      construct: (data: any) => {
        return { Ref: data };
      },
    },
  },
  {
    tag: '!Sub',
    options: {
      kind: 'scalar',
      construct: (data: any) => {
        return { 'Fn::Sub': data };
      },
    },
  },
  {
    tag: '!Sub',
    options: {
      kind: 'sequence',
      construct: (data: any) => {
        return { 'Fn::Sub': data };
      },
    },
  },
];

const getYamlTypes = (tagAndTypeArr: TagAndType[]) => {
  return tagAndTypeArr.map(({ tag, options }) => {
    return new yaml.Type(tag, options);
  });
};

/**
 * Transform CloudFormation directives in objects. For example, transform
 * !Ref Something in { Ref: Something }.
 */
export const getSchema = (tagAndTypeArr: TagAndType[] = []) => {
  return yaml.DEFAULT_SCHEMA.extend(
    getYamlTypes([...tagAndTypeArr, ...cloudFormationTypes])
  );
};

/**
 * Transform a JSON in a YAML string.
 *
 * @param cloudFormationTemplate JSON CloudFormation template
 * @returns YAML as string
 */
export const dumpToYamlCloudFormationTemplate = (
  cloudFormationTemplate: CloudFormationTemplate
) => {
  return yaml.dump(cloudFormationTemplate, { schema: getSchema() });
};

/**
 * Transform YAML string in JSON object.
 *
 * @param template template in String format.
 * @param tagAndTypeArr YAML types.
 * @returns JSON template.
 */
export const loadCloudFormationTemplate = (
  template: string,
  tagAndTypeArr: TagAndType[] = []
) => {
  return yaml.load(template, { schema: getSchema(tagAndTypeArr) });
};
