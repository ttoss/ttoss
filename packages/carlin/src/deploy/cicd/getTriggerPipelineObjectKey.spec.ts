import { faker } from '@ttoss/test-utils/faker';

import { getTriggerPipelinesObjectKey } from './getTriggerPipelineObjectKey';
import type { Pipeline } from './pipelines';

const prefix = faker.word.words();

test.each<[Pipeline]>([['tag'], ['main']])('main pipeline', (pipeline) => {
  expect(getTriggerPipelinesObjectKey({ prefix, pipeline })).toContain(
    `${prefix}/${pipeline}.zip`
  );
});
