import { Pipeline } from './pipelines';
import { faker } from '@ttoss/test-utils/faker';
import { getTriggerPipelinesObjectKey } from './getTriggerPipelineObjectKey';

const prefix = faker.word.words();

test.each<[Pipeline]>([['tag'], ['main']])('main pipeline', (pipeline) => {
  expect(getTriggerPipelinesObjectKey({ prefix, pipeline })).toContain(
    `${prefix}/${pipeline}.zip`
  );
});
