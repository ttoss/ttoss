/* eslint-disable global-require */
const fs = require('fs');
const yaml = require('js-yaml');

const cli = require('carlin/dist/cli').default;

const {
  baseStackTemplate,
} = require('carlin/dist/deploy/baseStack/deployBaseStack');

const { defaultTemplatePaths } = require('carlin/dist/deploy/cloudFormation');

const {
  getStaticAppTemplate,
} = require('carlin/dist/deploy/staticApp/staticApp.template');

const {
  getBuildSpec,
  getLambdaLayerBuilderTemplate,
} = require('carlin/dist/deploy/baseStack/getLambdaLayerBuilder.template');

const {
  getLambdaLayerTemplate,
} = require('carlin/dist/deploy/lambdaLayer/deployLambdaLayer');

const {
  getCicdTemplate,
  getRepositoryImageBuilder,
  ECR_REPOSITORY_LOGICAL_ID,
  REPOSITORY_ECS_TASK_DEFINITION_LOGICAL_ID,
} = require('carlin/dist/deploy/cicd/cicd.template');

const { getComment, getComments, toHtml } = require('./comments');

const {
  global: testsCoverageThreshold,
} = require('carlin/jest.coverageThreshold');

const cliApi = async (cmd) => {
  return new Promise((resolve) => {
    cli().parse(cmd, { help: true }, (_, __, output) => {
      resolve(output);
    });
  });
};

module.exports = () => {
  return {
    name: 'carlin',
    loadContent: async () => {
      const s3 = {
        bucket: 'my-bucket',
        key: 'some-key',
        versionId: 'version-id',
      };

      return {
        defaultTemplatePaths,

        deployApi: await cliApi('deploy'),
        deployStaticAppApi: await cliApi('deploy static-app'),
        deployLambdaLayerApi: await cliApi('deploy lambda-layer'),
        deployCicdApi: await cliApi('deploy cicd'),

        ...getComments({
          deployComment: ['deploy/cloudFormation.core.js', 'deploy'],
          deployCloudFormationDeployLambdaCodeComment: [
            'deploy/cloudFormation.js',
            'deployCloudFormation~deployCloudFormationDeployLambdaCode',
          ],
          deployBaseStackComment: [
            'deploy/baseStack/deployBaseStack.js',
            'deployBaseStack',
          ],
          deployLambdaCodeComment: [
            'deploy/lambda/deployLambdaCode.js',
            'deployLambdaCode',
          ],
          deployStaticAppComment: [
            'deploy/staticApp/deployStaticApp.js',
            'deployStaticApp',
          ],
          removeOldVersionsComment: [
            'deploy/staticApp/removeOldVersions.js',
            'removeOldVersions',
          ],
          destroyComment: ['deploy/cloudFormation.js', 'destroy'],
          assignSecurityHeadersComment: [
            'deploy/staticApp/staticApp.template.js',
            'assignSecurityHeaders',
          ],
          getPackageLambdaLayerStackNameComment: [
            'deploy/lambdaLayer/deployLambdaLayer.js',
            'getPackageLambdaLayerStackName',
          ],
          cliEnvComment: ['cli.js', 'getEnv'],
          cliGetConfigComment: ['cli.js', 'cli~getConfig'],
          cliGetPkgConfigComment: ['cli.js', 'getPkgConfig'],
          getCurrentBranchComment: [
            'utils/getCurrentBranch.js',
            'getCurrentBranch',
          ],
          getProjectNameComment: ['utils/getProjectName.js', 'getProjectName'],
          cicdTemplateGetEcrRepositoryComment: [
            'deploy/cicd/cicd.template.js',
            'getCicdTemplate~getEcrRepositoryResource',
          ],
          cicdApiV1HandlerComment: [
            'deploy/cicd/lambdas/cicdApiV1.handler.js',
            'cicdApiV1Handler',
          ],
          cicdTemplateGetRepositoryImageBuilderComment: [
            'deploy/cicd/cicd.template.js',
            'getRepositoryImageBuilder',
          ],
          generateEnvComment: ['generateEnv/generateEnv.js', 'generateEnv'],
        }),

        stackNameComment: toHtml(
          getComment(['deploy/stackName.js', 'getStackName']).split(
            'CAUTION!!!'
          )[0]
        ),
        stackNameWarningComment: toHtml(
          getComment(['deploy/stackName.js', 'getStackName']).split(
            'CAUTION!!!'
          )[1]
        ),

        deployExamples: require('carlin/dist/deploy/command').examples,

        lambdaLayerBuildspec: getBuildSpec(),
        lambdaLayerBuildspecCommands: yaml.dump(
          yaml.load(getBuildSpec({ packageName: 'PACKAGE@X.Y.Z' })).phases
            .install.commands
        ),
        lambdaLayerCodeBuildProjectTemplate: getLambdaLayerBuilderTemplate(),
        lambdaLayerTemplate: getLambdaLayerTemplate({
          bucket: 'BASE_BUCKET_NAME',
          key: 'lambda-layer/packages/PACKAGE@X.Y.Z.zip',
          packageName: 'PACKAGE@X.Y.Z.zip',
        }),

        cliOptions: require('carlin/dist/cli').options,
        deployOptions: require('carlin/dist/deploy/command').options,
        deployStaticAppOptions: require('carlin/dist/deploy/staticApp/command')
          .options,
        deployLambdaLayerOptions:
          require('carlin/dist/deploy/lambdaLayer/command').options,

        baseStackTemplate,
        staticAppOnlyS3Template: getStaticAppTemplate({}),
        staticAppCloudFrontTemplate: getStaticAppTemplate({
          cloudfront: true,
        }),
        ...(() => {
          const cicdTemplate = getCicdTemplate({ pipelines: ['main'], s3 });
          return {
            cicdTemplate,
            cicdTemplateEcrRepository:
              cicdTemplate.Resources[ECR_REPOSITORY_LOGICAL_ID],
          };
        })(),
        carlinCicdRepositoryImageBuilderBuildSpec:
          getRepositoryImageBuilder().Properties.Source.BuildSpec,
        carlinCicdRepositoryImageBuilderDockerfile:
          getRepositoryImageBuilder().Properties.Environment.EnvironmentVariables.find(
            ({ Name }) => {
              return Name === 'DOCKERFILE';
            }
          ).Value['Fn::Sub'],
        carlinCicdRepositoryEcsTaskDefinition: getCicdTemplate({ s3 })
          .Resources[REPOSITORY_ECS_TASK_DEFINITION_LOGICAL_ID].Properties,
        testsCoverageThreshold: yaml.dump(testsCoverageThreshold),
      };
    },
    contentLoaded: async ({ actions, content }) => {
      const { createData } = actions;

      Object.entries(content).forEach(async ([key, value]) => {
        await createData(
          `${key}.js`,
          `module.exports.${key} = ${JSON.stringify(value, null, 2)}`
        );
      });
    },
  };
};
