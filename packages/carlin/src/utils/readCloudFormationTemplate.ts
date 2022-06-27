import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationTemplate,
  TagAndType,
  loadCloudFormationTemplate,
} from './cloudFormationTemplate';

const getTypes = (): TagAndType[] => [
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
