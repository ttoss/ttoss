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
  wrapperForTests: ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  },
});

export { validationMessageComponentMeta, validationMessageContractConfig };

/**
 * ValidationMessage — form field error or validation feedback text.
 *
 * Wraps `Field.ErrorText` from Ark UI, which:
 * - wires `aria-describedby` automatically via Field context
 * - only renders its children when `Field.Root` has `invalid={true}`
 * - adds `role="alert"` / `aria-live` for accessible announcements
 *
 * Always uses `negative` evaluation — validation messages communicate errors.
 * This evaluation is not consumer-configurable; it is part of the semantic contract.
 *
 * Must be rendered inside a `Field.Root` to display. When `Field.Root` does not
 * have `invalid={true}`, Ark suppresses rendering automatically.
 *
 * @example
 * <Field.Root invalid={!!error}>
 *   <Label>Email</Label>
 *   <Input type="email" />
 *   <ValidationMessage>{error?.message}</ValidationMessage>
 * </Field.Root>
 */
export const ValidationMessage = React.forwardRef<
  HTMLSpanElement,
  ValidationMessageProps
>((props, ref) => {
  return <ValidationMessageBase ref={ref} {...props} />;
});
ValidationMessage.displayName = 'ValidationMessage';
