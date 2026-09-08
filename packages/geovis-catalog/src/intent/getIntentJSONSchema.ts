import { z } from 'zod';

import { intentSchema } from './schema';

/**
 * Returns `AnalyticalIntent`'s JSON Schema, directly usable as an LLM
 * structured-output or function-calling `input_schema` (PRD-005's Must
 * item). Derived from `intentSchema` via `z.toJSONSchema` (D2/D5) — no
 * hand-maintained JSON Schema document exists anywhere in this package, so
 * the document can never drift from what `validateIntent` actually accepts.
 */
export const getIntentJSONSchema = (): Record<string, unknown> => {
  return z.toJSONSchema(intentSchema, { target: 'draft-2020-12' });
};
