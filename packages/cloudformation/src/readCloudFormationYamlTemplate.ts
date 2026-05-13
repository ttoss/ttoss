import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CloudFormationTemplate } from './CloudFormationTemplate';
import type { TagAndType } from './cloudFormationYamlTemplate';
import { loadCloudFormationTemplate } from './cloudFormationYamlTemplate';

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
