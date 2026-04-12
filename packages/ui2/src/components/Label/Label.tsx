import * as React from 'react';

import { COMPONENT_TOKENS as T } from '../../_model/componentTokens';
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

const {
  Component: LabelBase,
  contractConfig: labelContractConfig,
  componentMeta: labelComponentMeta,
} = defineComponent({
  name: 'Label',
  scope: 'label',
  responsibility: 'Structure',
  element: 'label',
  evaluation: 'secondary',
  hasConsequence: false,
  dimensions: ['text'],
  layout: {
    base: {
      display: 'block',
      fontFamily: T.text.label.sm.fontFamily,
      fontSize: T.text.label.sm.fontSize,
      fontWeight: T.text.label.sm.fontWeight,
      lineHeight: T.text.label.sm.lineHeight,
      letterSpacing: T.text.label.sm.letterSpacing,
      fontOpticalSizing: T.text.label.sm.fontOpticalSizing,
      marginBottom: T.spacing.gap.inline.sm,
    },
  },
  wrapperForTests: ({ children }) => {
    return <>{children}</>;
  },
});

export { labelComponentMeta, labelContractConfig };

/**
 * Label — a semantic form field label that participates in Ark UI Field context.
 *
 * Wraps `Field.Label` from Ark UI, which wires `htmlFor` automatically via
 * the Field context — no manual `id`/`htmlFor` matching required.
 *
 * State propagation from `Field.Root`:
 * - `disabled` → Ark adds `data-disabled` — CSS applies disabled color tokens
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
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (props, ref) => {
    return <LabelBase ref={ref} {...props} />;
  }
);
Label.displayName = 'Label';
