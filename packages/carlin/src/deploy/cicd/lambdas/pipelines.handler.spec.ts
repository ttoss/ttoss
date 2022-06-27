import { faker } from '@ttoss/test-utils/faker';
import { getJobDetailsFilename } from './pipelines.handler';

test('getJobDetailsFilename', () => {
  const jobId = faker.datatype.uuid();
  expect(getJobDetailsFilename(jobId)).toEqual(`/tmp/${jobId}.zip`);
});
