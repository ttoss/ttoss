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

const defaultTestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

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
  wrapperForTests: defaultTestWrapper,
});

export { labelComponentMeta, labelContractConfig };

/**
 * Label — a semantic form field label.
 *
 * A native `<label>` element with semantic tokens applied. Intended to work
 * with Input and other form components, but can be used standalone.
 *
 * Always uses `secondary` evaluation — labels are supporting text with
 * intentional visual subordination to body content.
 *
 * @example
 * <Label>Email address</Label>
 * <Input placeholder="you@example.com" />
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (props, ref) => {
    return <LabelBase ref={ref} {...props} />;
  }
);
Label.displayName = 'Label';
