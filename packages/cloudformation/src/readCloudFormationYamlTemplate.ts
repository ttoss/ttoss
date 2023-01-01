import * as fs from 'fs';
import * as path from 'path';
import { CloudFormationTemplate } from './CloudFormationTemplate';
import {
  TagAndType,
  loadCloudFormationTemplate,
} from './cloudFormationYamlTemplate';

const getTypes = (): TagAndType[] => {
  return [
    {
      tag: `!SubString`,
      options: {
        kind: 'scalar',
        construct: (filePath: string) => {
          return fs
            .readFileSync(path.resolve(process.cwd(), filePath))
            .toString();
        },
      },
    },
  ];
};

/**
 * CloudFormation
 * @param param0
 */
export const readCloudFormationYamlTemplate = ({
  templatePath,
}: {
  templatePath: string;
}): CloudFormationTemplate => {
  const template = fs.readFileSync(templatePath).toString();

  const parsed = loadCloudFormationTemplate(template, getTypes());

  if (!parsed || typeof parsed === 'string') {
    throw new Error('Cannot parse CloudFormation template.');
  }

  return parsed as CloudFormationTemplate;
};
