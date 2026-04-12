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

const defaultTestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

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
  wrapperForTests: defaultTestWrapper,
});

export { helperTextComponentMeta, helperTextContractConfig };

/**
 * HelperText — supporting descriptive text for a form field.
 *
 * A native `<span>` element with semantic tokens applied. Used to provide
 * helpful context or instructions about a form field.
 *
 * Always uses `muted` evaluation — helper text is intentionally de-emphasized
 * to maintain visual hierarchy: label > input > helper text.
 *
 * @example
 * <Label>Password</Label>
 * <Input type="password" />
 * <HelperText>Must be at least 8 characters.</HelperText>
 */
export const HelperText = React.forwardRef<HTMLSpanElement, HelperTextProps>(
  (props, ref) => {
    return <HelperTextBase ref={ref} {...props} />;
  }
);
HelperText.displayName = 'HelperText';
