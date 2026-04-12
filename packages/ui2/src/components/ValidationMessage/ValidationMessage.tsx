import * as React from 'react';

import { COMPONENT_TOKENS as T } from '../../_model/componentTokens';
import { defineComponent } from '../../_model/defineComponent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the ValidationMessage component.
 */
export interface ValidationMessageProps extends React.HTMLAttributes<HTMLSpanElement> {}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const defaultTestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const {
  Component: ValidationMessageBase,
  contractConfig: validationMessageContractConfig,
  componentMeta: validationMessageComponentMeta,
} = defineComponent({
  name: 'ValidationMessage',
  scope: 'validation-message',
  responsibility: 'Feedback',
  element: 'span',
  evaluation: 'negative',
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

export { validationMessageComponentMeta, validationMessageContractConfig };

/**
 * ValidationMessage — form field error or validation feedback text.
 *
 * A native `<span>` element with semantic tokens applied. Shows validation
 * errors and feedback for form fields.
 *
 * Always uses `negative` evaluation — validation messages communicate errors.
 * This evaluation is not consumer-configurable; it is part of the semantic contract.
 *
 * @example
 * <Label>Email</Label>
 * <Input type="email" />
 * {error && <ValidationMessage>{error}</ValidationMessage>}
 */
export const ValidationMessage = React.forwardRef<
  HTMLSpanElement,
  ValidationMessageProps
>((props, ref) => {
  return <ValidationMessageBase ref={ref} {...props} />;
});
ValidationMessage.displayName = 'ValidationMessage';
