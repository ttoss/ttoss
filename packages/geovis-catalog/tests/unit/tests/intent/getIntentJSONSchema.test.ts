import { getIntentJSONSchema } from 'src/intent/getIntentJSONSchema';
import { ANALYTICAL_TASKS } from 'src/intent/taskVocabulary';

describe('getIntentJSONSchema — happy path', () => {
  test('derives a document whose properties.analyticalTask.enum lists all nine analytical tasks', () => {
    const jsonSchema = getIntentJSONSchema() as {
      properties: { analyticalTask: { enum: string[] } };
    };
    expect(jsonSchema.properties.analyticalTask.enum).toEqual(
      expect.arrayContaining([...ANALYTICAL_TASKS])
    );
    expect(jsonSchema.properties.analyticalTask.enum).toHaveLength(
      ANALYTICAL_TASKS.length
    );
  });

  test('required fields match intentSchema shape (metricId, geographyId, analyticalTask, schemaVersion)', () => {
    const jsonSchema = getIntentJSONSchema() as { required: string[] };
    expect(jsonSchema.required).toEqual(
      expect.arrayContaining([
        'schemaVersion',
        'analyticalTask',
        'metricId',
        'geographyId',
      ])
    );
  });

  test('optional fields are absent from required', () => {
    const jsonSchema = getIntentJSONSchema() as { required: string[] };
    expect(jsonSchema.required).not.toEqual(
      expect.arrayContaining(['categoryId', 'denominatorMetricId', 'datasetId'])
    );
  });
});

describe('getIntentJSONSchema — identity invariant', () => {
  test('is pure: repeated calls deep-equal each other', () => {
    expect(getIntentJSONSchema()).toEqual(getIntentJSONSchema());
  });
});
