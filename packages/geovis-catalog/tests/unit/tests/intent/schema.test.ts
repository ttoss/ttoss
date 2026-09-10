import {
  INTENT_SCHEMA_VERSION,
  intentFilterSchema,
  intentSchema,
  intentTimeSchema,
} from 'src/intent/schema';
import {
  ANALYTICAL_TASKS,
  type AnalyticalTask,
} from 'src/intent/taskVocabulary';

import {
  maximalIntent,
  minimalIntent,
  sampleIntentsByTask,
} from '../../fixtures/sampleIntents';

describe('intentSchema — happy path', () => {
  test.each(ANALYTICAL_TASKS)('round-trips a valid %s intent', (task) => {
    const result = intentSchema.safeParse(sampleIntentsByTask[task]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.analyticalTask).toBe(task);
    }
  });

  test('minimal intent (analyticalTask+metricId+geographyId only) validates', () => {
    const result = intentSchema.safeParse(minimalIntent);
    expect(result.success).toBe(true);
  });

  test('maximal intent (every optional field populated) validates', () => {
    const result = intentSchema.safeParse(maximalIntent);
    expect(result.success).toBe(true);
  });

  test('rationale and filters are optional', () => {
    const { rationale: _rationale, filters: _filters, ...rest } = maximalIntent;
    expect(intentSchema.safeParse(rest).success).toBe(true);
  });
});

describe('intentSchema — error handling', () => {
  test('rejects an out-of-vocabulary analyticalTask', () => {
    const result = intentSchema.safeParse({
      ...minimalIntent,
      analyticalTask: 'not-a-real-task',
    });
    expect(result.success).toBe(false);
  });

  test('rejects a filter with an invalid op', () => {
    const result = intentSchema.safeParse({
      ...minimalIntent,
      filters: [{ field: 'filter-populacao', op: 'squiggly', value: 1 }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a malformed time.start', () => {
    const result = intentSchema.safeParse({
      ...minimalIntent,
      time: { start: 'banana' },
    });
    expect(result.success).toBe(false);
  });

  test('rejects an unknown top-level property (strictObject)', () => {
    const result = intentSchema.safeParse({
      ...minimalIntent,
      unexpectedField: 'nope',
    });
    expect(result.success).toBe(false);
  });

  test('rejects a non-numeric schemaVersion', () => {
    const result = intentSchema.safeParse({
      ...minimalIntent,
      schemaVersion: '1',
    });
    expect(result.success).toBe(false);
  });
});

describe('intentTimeSchema — edge cases', () => {
  test('accepts a bare ISO date', () => {
    expect(intentTimeSchema.safeParse({ start: '2020-01-01' }).success).toBe(
      true
    );
  });

  test('accepts a full ISO datetime', () => {
    expect(
      intentTimeSchema.safeParse({ start: '2020-01-01T10:00:00Z' }).success
    ).toBe(true);
  });

  test('accepts start and end mixing date-only and datetime formats', () => {
    expect(
      intentTimeSchema.safeParse({
        start: '2020-01-01',
        end: '2022-12-31T23:59:59Z',
      }).success
    ).toBe(true);
  });

  test('accepts an empty object (both bounds optional)', () => {
    expect(intentTimeSchema.safeParse({}).success).toBe(true);
  });

  test('rejects an ISO-looking but invalid calendar date', () => {
    expect(intentTimeSchema.safeParse({ start: '2023-13-45' }).success).toBe(
      false
    );
  });
});

describe('intentFilterSchema — edge cases', () => {
  test('accepts a string value', () => {
    expect(
      intentFilterSchema.safeParse({
        field: 'filter-regiao',
        op: 'eq',
        value: 'nordeste',
      }).success
    ).toBe(true);
  });

  test('accepts a numeric value', () => {
    expect(
      intentFilterSchema.safeParse({
        field: 'filter-populacao',
        op: 'gte',
        value: 100,
      }).success
    ).toBe(true);
  });

  test('accepts an array value for `in`/`not-in`', () => {
    expect(
      intentFilterSchema.safeParse({
        field: 'filter-regiao',
        op: 'in',
        value: ['nordeste', 'sul'],
      }).success
    ).toBe(true);
  });

  test("accepts the not-in operator, absent from the plan's original symbolic vocabulary (D10)", () => {
    expect(
      intentFilterSchema.safeParse({
        field: 'filter-regiao',
        op: 'not-in',
        value: ['nordeste'],
      }).success
    ).toBe(true);
  });

  test('rejects a value that is neither string, number, nor array of either', () => {
    expect(
      intentFilterSchema.safeParse({
        field: 'filter-regiao',
        op: 'eq',
        value: { nested: true },
      }).success
    ).toBe(false);
  });
});

describe('schema/type parity (D2 acceptance criterion)', () => {
  test('intentSchema.analyticalTask enum matches ANALYTICAL_TASKS exactly', () => {
    const shape = intentSchema.shape.analyticalTask;
    expect(new Set(shape.options)).toEqual(new Set(ANALYTICAL_TASKS));
    expect(shape.options).toHaveLength(ANALYTICAL_TASKS.length);
  });

  test('every ANALYTICAL_TASKS member has a fixture in sampleIntentsByTask', () => {
    const covered = Object.keys(sampleIntentsByTask) as AnalyticalTask[];
    expect(new Set(covered)).toEqual(new Set(ANALYTICAL_TASKS));
  });
});

describe('identity invariant', () => {
  test('parsing a valid intent is idempotent: parse(parse(x)) deep-equals parse(x)', () => {
    const once = intentSchema.parse(maximalIntent);
    const twice = intentSchema.parse(once);
    expect(twice).toEqual(once);
  });

  test('parsing performs no silent transformation: parse(x) deep-equals x for every task fixture', () => {
    for (const task of ANALYTICAL_TASKS) {
      const input = sampleIntentsByTask[task];
      expect(intentSchema.parse(input)).toEqual(input);
    }
  });

  test('INTENT_SCHEMA_VERSION is a stable literal, not derived per call', () => {
    expect(INTENT_SCHEMA_VERSION).toBe(1);
    expect(INTENT_SCHEMA_VERSION).toBe(INTENT_SCHEMA_VERSION);
  });
});
