import { Field } from '@ark-ui/react';
import * as React from 'react';

import { defineComponent } from '../../_model/defineComponent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the Label component.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const { Component: LabelBase, contractConfig: labelContractConfig } = defineComponent({
  name: 'Label',
  scope: 'label',
  responsibility: 'Structure',
  element: 'Field.Label',
  evaluation: 'secondary',
  hasConsequence: false,
  dimensions: ['text'],
  wrapperForTests: ({ children }) => <Field.Root>{children}</Field.Root>,
});

export { labelContractConfig };

/**
 * Label — a semantic form field label that participates in Ark UI Field context.
 *
 * Wraps `Field.Label` from Ark UI, which wires `htmlFor` automatically via
 * the Field context — no manual `id`/`htmlFor` matching required.
 *
 * State propagation from `Field.Root`:
 * - `disabled` → Ark adds `data-disabled` — CSS applies `--_text-disabled`
 * - `required` → Ark adds `data-required` — CSS renders the required indicator
 * - `invalid`  → Ark adds `data-invalid` — label color unchanged (intentional)
 *
 * Uses `Structure` responsibility with `secondary` evaluation — labels are
 * supporting text with intentional visual subordination to body content.
 *
 * @example
 * <Field.Root>
 *   <Label>Email address</Label>
 *   <Input placeholder="you@example.com" />
 * </Field.Root>
 */
export const Label = (props: LabelProps) => {
  return <LabelBase {...props} />;
};
