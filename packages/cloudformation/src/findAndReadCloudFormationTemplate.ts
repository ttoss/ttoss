import * as fs from 'fs';
import * as path from 'path';
import { CloudFormationTemplate } from './cloudFormationTemplate';
import { readCloudFormationYamlTemplate } from './readCloudFormationYamlTemplate';
import { readObjectFile } from './readObjectFile';

export const defaultTemplatePaths = ['ts', 'js', 'yaml', 'yml', 'json'].map(
  (extension) => {
    return `./src/cloudformation.${extension}`;
  }
);

export const findAndReadCloudFormationTemplate = ({
  templatePath: defaultTemplatePath,
}: {
  templatePath?: string;
}): CloudFormationTemplate => {
  const templatePath =
    defaultTemplatePath ||
    defaultTemplatePaths
      /**
       * Iterate over extensions. If the template of the current extension is
       * found, we save it on the accumulator and return it every time until
       * the loop ends.
       */
      .reduce((acc, cur) => {
        if (acc) {
          return acc;
        }

        return fs.existsSync(path.resolve(process.cwd(), cur)) ? cur : acc;
      }, '');

  if (!templatePath) {
    throw new Error('Cannot find a CloudFormation template.');
  }

  const extension = templatePath?.split('.').pop() as string;

  const fullPath = path.resolve(process.cwd(), templatePath);

  /**
   * We need to read Yaml first because CloudFormation specific tags aren't
   * recognized when parsing a simple Yaml file. I.e., a possible error:
   * "Error message: "unknown tag !<!Ref> at line 21, column 34:\n"
   */
  if (['yaml', 'yml'].includes(extension)) {
    return readCloudFormationYamlTemplate({ templatePath });
  }

  return readObjectFile({ path: fullPath });
};
