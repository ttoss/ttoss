import * as React from 'react';

import { COMPONENT_TOKENS as T } from '../../_model/componentTokens';
import { defineComponent } from '../../_model/defineComponent';
import type { Evaluation } from '../../_model/taxonomy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Size scale for the Input. Maps to semantic hit-target and inset tokens. */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Input component.
 */
export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  /**
   * Semantic emphasis — maps to the color role of input tokens.
   * @default 'primary'
   */
  evaluation?: Evaluation;

  /**
   * Size variant — maps to semantic hit-target sizing and inset tokens.
   * @default 'md'
   */
  size?: InputSize;
}

// ---------------------------------------------------------------------------
// Factory definition
// ---------------------------------------------------------------------------

const {
  Component: InputBase,
  contractConfig: inputContractConfig,
  componentMeta: inputComponentMeta,
} = defineComponent({
  name: 'Input',
  scope: 'input',
  responsibility: 'Input',
  element: 'input',
  hasConsequence: false,
  withInvalidOverlay: true,
  isVoid: true,
  sizes: ['sm', 'md', 'lg'] as const,
  layout: {
    base: {
      display: 'block',
      width: '100%',
      minHeight: T.sizing.hit.base,
      paddingBlock: T.spacing.inset.control.sm,
      paddingInline: T.spacing.inset.control.md,
      borderRadius: T.radii.control,
      borderWidth: T.border.outline.control.width,
      borderStyle: T.border.outline.control.style,
      fontFamily: T.text.label.md.fontFamily,
      fontSize: T.text.label.md.fontSize,
      fontWeight: T.text.label.md.fontWeight,
      lineHeight: T.text.label.md.lineHeight,
      letterSpacing: T.text.label.md.letterSpacing,
      fontOpticalSizing: T.text.label.md.fontOpticalSizing,
      appearance: 'none',
      outline: 'none',
      transitionProperty: 'background-color, border-color, color',
      transitionDuration: T.motion.feedback.duration,
      transitionTimingFunction: T.motion.feedback.easing,
    },
    sizes: {
      sm: {
        minHeight: T.sizing.hit.min,
        paddingBlock: T.spacing.inset.control.sm,
        paddingInline: T.spacing.inset.control.sm,
        fontSize: T.text.label.sm.fontSize,
        fontWeight: T.text.label.sm.fontWeight,
        lineHeight: T.text.label.sm.lineHeight,
        letterSpacing: T.text.label.sm.letterSpacing,
        fontOpticalSizing: T.text.label.sm.fontOpticalSizing,
      },
      lg: {
        minHeight: T.sizing.hit.prominent,
        paddingBlock: T.spacing.inset.control.md,
        paddingInline: T.spacing.inset.control.lg,
        fontSize: T.text.label.lg.fontSize,
        fontWeight: T.text.label.lg.fontWeight,
        lineHeight: T.text.label.lg.lineHeight,
        letterSpacing: T.text.label.lg.letterSpacing,
        fontOpticalSizing: T.text.label.lg.fontOpticalSizing,
      },
    },
  },
  extraCss: [
    `[data-scope='input'][data-part='root']:focus-visible {
  outline: var(--tt-focus-ring-width) var(--tt-focus-ring-style)
    var(--tt-focus-ring-color);
  outline-offset: 2px;
}`,
  ],
  wrapperForTests: ({ children }) => {
    return <>{children}</>;
  },
});

export { inputComponentMeta, inputContractConfig };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Input — a semantic text input that participates in Ark UI Field context.
 *
 * Wraps `Field.Input` from Ark UI, which wires ARIA attributes automatically
 * when nested inside a `Field.Root` (`aria-labelledby`, `aria-describedby`,
 * `aria-invalid`, `aria-required`, `aria-readonly`).
 *
 * Invalid state is automatically reflected when `Field.Root` has `invalid={true}`:
 * Ark adds `data-invalid` to the underlying `<input>`, and static CSS
 * transitions to the negative-role color tokens without any React re-render.
 *
 * @example
 * // Standalone (no Field context)
 * <Input placeholder="Enter text" />
 *
 * @example
 * // Inside Field.Root — full ARIA wiring automatic
 * <Field.Root invalid={!!error} disabled={disabled}>
 *   <Input placeholder="Email" />
 * </Field.Root>
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', size = 'md', ...props }, ref) => {
    return <InputBase ref={ref} type={type} size={size} {...props} />;
  }
);
Input.displayName = 'Input';
