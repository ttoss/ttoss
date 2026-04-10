import { Field } from '@ark-ui/react';
import * as React from 'react';

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

const { Component: InputBase, contractConfig: inputContractConfig } =
  defineComponent({
    name: 'Input',
    scope: 'input',
    responsibility: 'Input',
    element: 'Field.Input',
    hasConsequence: false,
    withInvalidOverlay: true,
    isVoid: true,
    sizes: ['sm', 'md', 'lg'] as const,
    wrapperForTests: ({ children }) => <Field.Root>{children}</Field.Root>,
  });

export { inputContractConfig };

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
 * Ark adds `data-invalid` to the underlying `<input>`, and CSS transitions to
 * the `--_border-invalid` scoped var without any React re-render or prop change.
 *
 * Both primary and negative color roles are resolved at render time and injected
 * as `--_*` and `--_*-invalid` scoped vars. CSS uses whichever set matches
 * the current `[data-invalid]` state.
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
export const Input = ({ type = 'text', size = 'md', ...props }: InputProps) => (
  <InputBase type={type} size={size} {...props} />
);
