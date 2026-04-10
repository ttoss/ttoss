import { Field } from '@ark-ui/react';
import * as React from 'react';

import { defineComponent } from '../../_model/defineComponent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the HelperText component.
 */
export interface HelperTextProps extends React.HTMLAttributes<HTMLSpanElement> {}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const { Component: HelperTextBase, contractConfig: helperTextContractConfig } = defineComponent({
  name: 'HelperText',
  scope: 'helper-text',
  responsibility: 'Feedback',
  element: 'Field.HelperText',
  evaluation: 'muted',
  hasConsequence: false,
  dimensions: ['text'],
  wrapperForTests: ({ children }) => <Field.Root>{children}</Field.Root>,
});

export { helperTextContractConfig };

/**
 * HelperText — supporting descriptive text for a form field.
 *
 * Wraps `Field.HelperText` from Ark UI, which wires `aria-describedby`
 * automatically via the Field context.
 *
 * Always uses `muted` evaluation — helper text is intentionally de-emphasized
 * to maintain visual hierarchy: label > input > helper text (> error text).
 * This evaluation is not consumer-configurable; it is part of the semantic contract.
 *
 * @example
 * <Field.Root>
 *   <Label>Password</Label>
 *   <Input type="password" />
 *   <HelperText>Must be at least 8 characters.</HelperText>
 * </Field.Root>
 */
export const HelperText = (props: HelperTextProps) => {
  return <HelperTextBase {...props} />;
};
