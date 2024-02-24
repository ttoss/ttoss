// /* eslint-disable global-require */
// import {
//   ECR_REPOSITORY_LOGICAL_ID,
//   REPOSITORY_ECS_TASK_DEFINITION_LOGICAL_ID,
//   getCicdTemplate,
//   getRepositoryImageBuilder,
// } from 'carlin/src/deploy/cicd/cicd.template';
// import { baseStackTemplate } from 'carlin/src/deploy/baseStack/deployBaseStack';
// import { cli } from 'carlin/src/cli';
// import { defaultTemplatePaths } from 'carlin/src/deploy/cloudformation';
// import {
//   getBuildSpec,
//   getLambdaLayerBuilderTemplate,
// } from 'carlin/src/deploy/baseStack/getLambdaLayerBuilderTemplate';
// import { getComment, getComments, toHtml } from './comments';
// import { getLambdaLayerTemplate } from 'carlin/src/deploy/lambdaLayer/deployLambdaLayer';
// import { getStaticAppTemplate } from 'carlin/src/deploy/staticApp/staticApp.template';
// import { global as testsCoverageThreshold } from 'carlin/jest.coverageThreshold';
// import yaml from 'js-yaml';

// const cliApi = async (cmd) => {
//   return new Promise((resolve) => {
//     // eslint-disable-next-line max-params
//     cli().parse(cmd, { help: true }, (_, __, output) => {
//       resolve(output);
//     });
//   });
// };

// /**
//  * https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis
//  */
// // eslint-disable-next-line import/no-default-export, @typescript-eslint/no-unused-vars
// export default (context, options) => {
//   return {
//     name: 'carlin',
//     loadContent: async () => {
//       const s3 = {
//         bucket: 'my-bucket',
//         key: 'some-key',
//         versionId: 'version-id',
//       };

//       return {
//         defaultTemplatePaths,

//         deployApi: await cliApi('deploy'),
//         deployStaticAppApi: await cliApi('deploy static-app'),
//         deployLambdaLayerApi: await cliApi('deploy lambda-layer'),
//         deployCicdApi: await cliApi('deploy cicd'),

//         ...getComments({
//           deployComment: ['deploy/cloudformation.core.js', 'deploy'],
//           deployCloudFormationDeployLambdaCodeComment: [
//             'deploy/cloudformation.js',
//             'deployCloudformation~deployCloudFormationDeployLambdaCode',
//           ],
//           deployBaseStackComment: [
//             'deploy/baseStack/deployBaseStack.js',
//             'deployBaseStack',
//           ],
//           deployLambdaCodeComment: [
//             'deploy/lambda/deployLambdaCode.js',
//             'deployLambdaCode',
//           ],
//           deployStaticAppComment: [
//             'deploy/staticApp/deployStaticApp.js',
//             'deployStaticApp',
//           ],
//           removeOldVersionsComment: [
//             'deploy/staticApp/removeOldVersions.js',
//             'removeOldVersions',
//           ],
//           destroyComment: ['deploy/cloudformation.js', 'destroy'],
//           assignSecurityHeadersComment: [
//             'deploy/staticApp/staticApp.template.js',
//             'assignSecurityHeaders',
//           ],
//           getPackageLambdaLayerStackNameComment: [
//             'deploy/lambdaLayer/deployLambdaLayer.js',
//             'getPackageLambdaLayerStackName',
//           ],
//           cliEnvComment: ['cli.js', 'getEnv'],
//           cliGetConfigComment: ['cli.js', 'cli~getConfig'],
//           cliGetPkgConfigComment: ['cli.js', 'getPkgConfig'],
//           getCurrentBranchComment: [
//             'utils/getCurrentBranch.js',
//             'getCurrentBranch',
//           ],
//           getProjectNameComment: ['utils/getProjectName.js', 'getProjectName'],
//           cicdTemplateGetEcrRepositoryComment: [
//             'deploy/cicd/cicd.template.js',
//             'getCicdTemplate~getEcrRepositoryResource',
//           ],
//           cicdApiV1HandlerComment: [
//             'deploy/cicd/lambdas/cicdApiV1.handler.js',
//             'cicdApiV1Handler',
//           ],
//           cicdTemplateGetRepositoryImageBuilderComment: [
//             'deploy/cicd/cicd.template.js',
//             'getRepositoryImageBuilder',
//           ],
//           generateEnvComment: ['generateEnv/generateEnv.js', 'generateEnv'],
//         }),

//         stackNameComment: toHtml(
//           getComment(['deploy/stackName.js', 'getStackName']).split(
//             'CAUTION!!!'
//           )[0]
//         ),
//         stackNameWarningComment: toHtml(
//           getComment(['deploy/stackName.js', 'getStackName']).split(
//             'CAUTION!!!'
//           )[1]
//         ),

//         deployExamples: require('carlin/dist/deploy/command').examples,

//         lambdaLayerBuildspec: getBuildSpec(),
//         lambdaLayerBuildspecCommands: yaml.dump(
//           yaml.load(getBuildSpec({ packageName: 'PACKAGE@X.Y.Z' })).phases
//             .install.commands
//         ),
//         lambdaLayerCodeBuildProjectTemplate: getLambdaLayerBuilderTemplate(),
//         lambdaLayerTemplate: getLambdaLayerTemplate({
//           bucket: 'BASE_BUCKET_NAME',
//           key: 'lambda-layer/packages/PACKAGE@X.Y.Z.zip',
//           packageName: 'PACKAGE@X.Y.Z.zip',
//         }),

//         cliOptions: require('carlin/dist/cli').options,
//         deployOptions: require('carlin/dist/deploy/command').options,
//         deployStaticAppOptions: require('carlin/dist/deploy/staticApp/command')
//           .options,
//         deployLambdaLayerOptions:
//           require('carlin/dist/deploy/lambdaLayer/command').options,

//         baseStackTemplate,
//         staticAppOnlyS3Template: getStaticAppTemplate({}),
//         staticAppCloudFrontTemplate: getStaticAppTemplate({
//           cloudfront: true,
//         }),
//         ...(() => {
//           const cicdTemplate = getCicdTemplate({ pipelines: ['main'], s3 });
//           return {
//             cicdTemplate,
//             cicdTemplateEcrRepository:
//               cicdTemplate.Resources[ECR_REPOSITORY_LOGICAL_ID],
//           };
//         })(),
//         carlinCicdRepositoryImageBuilderBuildSpec:
//           getRepositoryImageBuilder().Properties.Source.BuildSpec,
//         carlinCicdRepositoryImageBuilderDockerfile:
//           getRepositoryImageBuilder().Properties.Environment.EnvironmentVariables.find(
//             ({ Name }) => {
//               return Name === 'DOCKERFILE';
//             }
//           ).Value['Fn::Sub'],
//         carlinCicdRepositoryEcsTaskDefinition: getCicdTemplate({ s3 })
//           .Resources[REPOSITORY_ECS_TASK_DEFINITION_LOGICAL_ID].Properties,
//         testsCoverageThreshold: yaml.dump(testsCoverageThreshold),
//       };
//     },
//     contentLoaded: async ({ actions, content }) => {
//       const { createData } = actions;

//       Object.entries(content).forEach(async ([key, value]) => {
//         await createData(
//           `${key}.js`,
//           `module.exports.${key} = ${JSON.stringify(value, null, 2)}`
//         );
//       });
//     },
//   };
// };

// eslint-disable-next-line import/no-default-export
export default () => {};
