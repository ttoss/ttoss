import Ajv2020 from 'ajv/dist/2020';

import schema from './schema.json' with { type: 'json' };
import type { VisualizationSpec } from './types';

export type ValidationResult =
  | { valid: true; spec: VisualizationSpec }
  | { valid: false; errors: string[] };

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

export const validateSpec = (input: unknown): ValidationResult => {
  const valid = _validate(input);

  if (valid) {
    return { valid: true, spec: input as VisualizationSpec };
  }

  const errors = (_validate.errors ?? []).map((e) => {
    return `${e.instancePath || '(root)'} ${e.message}`;
  });

  return { valid: false, errors };
};
