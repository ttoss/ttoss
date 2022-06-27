import type { Pipeline } from './pipelines';

/**
 * The file with this key inside the source S3 key of main and tag pipelines
 * will trigger those pipelines.
 */
export const getTriggerPipelinesObjectKey = ({
  prefix,
  pipeline,
}: {
  prefix: string;
  pipeline: Pipeline;
}) => {
  return `${prefix}/${pipeline}.zip`;
};
