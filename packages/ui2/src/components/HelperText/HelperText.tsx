import * as React from 'react';

import { COMPONENT_TOKENS as T } from '../../_model/componentTokens';
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

const {
  Component: HelperTextBase,
  contractConfig: helperTextContractConfig,
  componentMeta: helperTextComponentMeta,
} = defineComponent({
  name: 'HelperText',
  scope: 'helper-text',
  responsibility: 'Feedback',
  element: 'span',
  evaluation: 'muted',
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
      marginTop: T.spacing.gap.inline.sm,
    },
  },
  wrapperForTests: ({ children }) => {
    return <>{children}</>;
  },
});

export { helperTextComponentMeta, helperTextContractConfig };

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
export const HelperText = React.forwardRef<HTMLSpanElement, HelperTextProps>(
  (props, ref) => {
    return <HelperTextBase ref={ref} {...props} />;
  }
);
HelperText.displayName = 'HelperText';
