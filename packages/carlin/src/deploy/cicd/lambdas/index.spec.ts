import * as handlers from '.';

test('should export handlers', () => {
  expect(handlers.cicdApiV1Handler).toBeDefined();
  expect(handlers.ecsTaskReportHandler).toBeDefined();
  expect(handlers.githubWebhooksApiV1Handler).toBeDefined();
  expect(handlers.imageUpdaterScheduleHandler).toBeDefined();
  expect(handlers.pipelinesHandler).toBeDefined();
});
