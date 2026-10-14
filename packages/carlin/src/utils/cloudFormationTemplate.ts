/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CloudFormationTemplate } from '@ttoss/cloudformation';
import {
  CORE_SCHEMA,
  defineScalarTag,
  defineSequenceTag,
  dump,
  load,
  mergeTag,
  type TagDefinition,
} from 'js-yaml';

export interface TagAndType {
  tag: string;
  options: {
    kind: 'scalar' | 'sequence';
    construct: (data: any) => any;
  };
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

/**
 * The tags are load-only: dumping writes the intrinsic functions as plain
 * mappings (`Ref: SomeRef`), which CloudFormation also accepts.
 */
const getYamlTag = ({ tag, options }: TagAndType): TagDefinition => {
  if (options.kind === 'scalar') {
    return defineScalarTag(tag, {
      resolve: (source) => {
        return options.construct(source);
      },
      identify: () => {
        return false;
      },
    });
  }

  return defineSequenceTag<unknown[], unknown>(tag, {
    create: () => {
      return [];
    },
    addItem: (carrier, item) => {
      carrier.push(item);
    },
    finalize: (carrier) => {
      return options.construct(carrier);
    },
    identify: () => {
      return false;
    },
  });
};

/**
 * Transform CloudFormation directives in objects. For example, transform
 * !Ref Something in { Ref: Something }. Merge keys (`<<`) are supported.
 */
export const getSchema = (tagAndTypeArr: TagAndType[] = []) => {
  return CORE_SCHEMA.withTags(
    mergeTag,
    [...tagAndTypeArr, ...cloudFormationTypes].map(getYamlTag)
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
  return dump(cloudFormationTemplate);
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
  return load(template, { schema: getSchema(tagAndTypeArr) });
};
