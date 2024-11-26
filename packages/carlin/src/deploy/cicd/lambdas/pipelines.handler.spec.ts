import { faker } from '@ttoss/test-utils/faker';
import { getJobDetailsFilename } from './pipelines.handler';

test('getJobDetailsFilename', () => {
  const jobId = faker.string.uuid();
  expect(getJobDetailsFilename(jobId)).toEqual(`/tmp/${jobId}.zip`);
});
