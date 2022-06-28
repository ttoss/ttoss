import type { Pipeline } from './pipelines';

const projectName = 'my-project';

jest.mock('../../utils', () => ({
  ...(jest.requireActual('../../utils') as any),
  getProjectName: jest.fn(() => projectName),
}));

import {
  API_LOGICAL_ID,
  IMAGE_UPDATER_SCHEDULE_SERVERLESS_FUNCTION_LOGICAL_ID,
  PIPELINES_ARTIFACT_STORE_S3_BUCKET_LOGICAL_ID,
  PIPELINES_HANDLER_LAMBDA_FUNCTION_LOGICAL_ID,
  PIPELINES_MAIN_LOGICAL_ID,
  PIPELINES_ROLE_LOGICAL_ID,
  PIPELINES_TAG_LOGICAL_ID,
  getCicdTemplate,
} from './cicd.template';

const s3 = {
  bucket: 'bucket',
  key: 'key',
  versionId: 'versionId',
};

test('should have image updater schedule serverless function', () => {
  const template = getCicdTemplate({ s3 });

  const resource =
    template.Resources[IMAGE_UPDATER_SCHEDULE_SERVERLESS_FUNCTION_LOGICAL_ID];

  expect(resource).toBeDefined();

  expect(resource.Properties.Handler).toEqual(
    'index.imageUpdaterScheduleHandler'
  );
});

test('should have serverless API', () => {
  const template = getCicdTemplate({
    pipelines: ['main'],
    s3,
  });

  expect(template.Resources).toHaveProperty(API_LOGICAL_ID);
  expect(template.Resources[API_LOGICAL_ID].Type).toEqual(
    'AWS::Serverless::Api'
  );
  expect(
    template.Resources.GitHubWebhooksApiV1ServerlessFunction.Properties
      .Environment.Variables.TRIGGER_PIPELINES_OBJECT_KEY_PREFIX
  ).toEqual(`cicd/pipelines/triggers/${projectName}`);
});

test.each<[Pipeline[]]>([[[]], [['pr']]])(
  "don't create pipeline resources: %s",
  (pipelines) => {
    const template = getCicdTemplate({
      pipelines,
      s3,
    });

    expect(
      template.Resources[PIPELINES_ARTIFACT_STORE_S3_BUCKET_LOGICAL_ID]
    ).toBeUndefined();

    expect(
      template.Resources[PIPELINES_HANDLER_LAMBDA_FUNCTION_LOGICAL_ID]
    ).toBeUndefined();

    expect(template.Resources[PIPELINES_ROLE_LOGICAL_ID]).toBeUndefined();
  }
);

test.each<[Pipeline[]]>([[['main']], [['tag', 'main']], [['tag']]])(
  'create pipeline resources: %s',
  (pipelines) => {
    const template = getCicdTemplate({
      pipelines,
      s3,
    });

    expect(
      template.Resources[PIPELINES_ARTIFACT_STORE_S3_BUCKET_LOGICAL_ID]
    ).toBeDefined();

    expect(
      template.Resources[PIPELINES_HANDLER_LAMBDA_FUNCTION_LOGICAL_ID]
    ).toBeDefined();

    expect(template.Resources[PIPELINES_ROLE_LOGICAL_ID]).toBeDefined();
  }
);

test.each<[Pipeline[]]>([
  [['main']],
  [['main', 'pr']],
  [['main', 'tag']],
  [['main', 'tag', 'pr']],
])('create main pipeline resources: %s', (pipelines) => {
  const template = getCicdTemplate({
    pipelines,
    s3,
  });

  expect(template.Resources[PIPELINES_MAIN_LOGICAL_ID]).toBeDefined();
});

test.each<[Pipeline[]]>([
  [['tag']],
  [['tag', 'pr']],
  [['tag', 'main']],
  [['tag', 'main', 'pr']],
])('create tag pipeline resources: %s', (pipelines) => {
  const template = getCicdTemplate({
    pipelines,
    s3,
  });

  expect(template.Resources[PIPELINES_TAG_LOGICAL_ID]).toBeDefined();
});
