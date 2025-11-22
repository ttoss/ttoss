import { options as cliOptions } from 'carlin/src/cli';
import { defaultTemplatePaths } from 'carlin/src/deploy/cloudformation';
import * as deployCommand from 'carlin/src/deploy/command';

import { getComment, getCommentsAsHTML, toHTML } from './getComments.mjs';

export default () => {
  return {
    name: 'carlin',
    loadContent: async () => {
      const comments = await getCommentsAsHTML({
        buildLambdaCodeComment: [
          'deploy/lambda/buildLambdaCode.js',
          'buildLambdaCode',
        ],
        cliEnvironmentVariablesComment: ['cli.js', 'getEnv'],
        cliConfigFileComment: ['cli.js', 'cli~getConfig'],
        cliMultipleEnvironmentsComment: ['cli.js', 'cli~handleEnvironments'],
        cloudFormationOutputsComment: [
          'deploy/cloudformation.core.js',
          'printStackOutputsAfterDeploy',
        ],
        deployComment: ['deploy/cloudformation.core.js', 'deploy'],
        destroyComment: ['deploy/cloudformation.js', 'destroy'],
        getCloudformationTemplateOptionsComment: [
          'deploy/cloudformation.js',
          'getCloudformationTemplateOptions',
        ],
        optionsParametersComment: ['deploy/command.js', 'options.parameters'],
      });

      const [stackNameComment, stackNameWarningComment] = (
        await getComment(['deploy/stackName.js', 'getStackName'])
      )
        .split('CAUTION!!!')
        .map((comment) => {
          return toHTML(comment);
        });

      return {
        ...comments,
        cliOptions,
        defaultTemplatePaths,
        deployCommandExamples: deployCommand.examples,
        deployCommandOptions: deployCommand.options,
        stackNameComment,
        stackNameWarningComment,
      };
    },
    contentLoaded: async ({ actions, content }) => {
      for (const [key, value] of Object.entries(content)) {
        await actions.createData(
          `${key}.js`,
          `export const ${key} = ${JSON.stringify(value, null, 2)}`
        );
      }
    },
  };
};
