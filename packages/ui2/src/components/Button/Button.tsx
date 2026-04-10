import type * as React from 'react';

import { defineComponent } from '../../_model/defineComponent';
import type { Consequence, Evaluation } from '../../_model/taxonomy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Size scale for the Button. Maps to semantic hit-target and inset tokens. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Button component.
 *
 * Extends all native `<button>` HTML attributes. Semantic props (`evaluation`,
 * `consequence`, `size`) are extracted and translated to data attributes before
 * the rest is spread onto the underlying `<button>` element.
 */
export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'size'
> {
  /**
   * Semantic emphasis — determines which color role token set is applied.
   *
   * Maps directly to the `{role}` axis of the token grammar:
   * `--tt-colors-action-{evaluation}-{dimension}-{state}`
   *
   * - `primary`   — main call-to-action (filled, brand color)
   * - `secondary` — subordinate action (outlined, neutral)
   * - `muted`     — de-emphasized (ghost, low-contrast)
   * - `negative`  — harmful or adverse actions
   *
   * @default 'primary'
   */
  evaluation?: Evaluation;

  /**
   * Risk profile of the action.
   *
   * When `consequence` carries an implied evaluative override, it takes
   * precedence over `evaluation`:
   * - `'destructive'` → automatically resolves to `evaluation: 'negative'`
   *
   * This ensures destructive actions always surface the correct semantic tokens
   * without requiring the consumer to remember to set `evaluation="negative"`.
   *
   * @example
   * <Button consequence="destructive">Delete account</Button>
   * // → data-variant="negative" (automatic, not 'primary')
   */
  consequence?: Consequence;

  /**
   * Size variant — maps to semantic hit-target sizing and inset spacing tokens.
   *
   * - `sm` → `--tt-sizing-hit-min`, `--tt-spacing-inset-control-sm`
   * - `md` → `--tt-sizing-hit-base`, `--tt-spacing-inset-control-md` (default)
   * - `lg` → `--tt-sizing-hit-prominent`, `--tt-spacing-inset-control-lg`
   *
   * @default 'md'
   */
  size?: ButtonSize;
}

// ---------------------------------------------------------------------------
// Factory definition
// ---------------------------------------------------------------------------

const { Component: ButtonBase, contractConfig: buttonContractConfig } =
  defineComponent({
    name: 'Button',
    scope: 'button',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: true,
    sizes: ['sm', 'md', 'lg'] as const,
  });

export { buttonContractConfig };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Button — a semantic action trigger.
 *
 * A thin wrapper over the native `<button>` element that applies the
 * `@ttoss/theme2` semantic token system via `data-scope`, `data-part`,
 * `data-variant`, and `data-size` attributes. CSS in `styles.css` targets
 * these attributes to apply the correct color and sizing tokens.
 *
 * Token resolution is deterministic: given a `ComponentExpression` with
 * `responsibility: 'Action'`, `resolveTokens()` decides the `role` (ux context
 * color role) based on `evaluation` and `consequence`. The resolved role is
 * written to `data-variant`, which CSS uses to apply the correct token set.
 *
 * Semantic guarantees:
 * - Uses only `action.*` semantic color tokens (never core tokens)
 * - `consequence="destructive"` always resolves to `negative` role — automatic,
 *   no consumer involvement required
 * - Semantic data attributes (`data-scope`, `data-part`, `data-variant`,
 *   `data-size`) are applied after `{...props}` and cannot be overridden
 *
 * @example
 * // Primary action (default)
 * <Button onClick={handleSave}>Save changes</Button>
 *
 * @example
 * // Secondary action
 * <Button evaluation="secondary" onClick={handleCancel}>Cancel</Button>
 *
 * @example
 * // Destructive — consequence drives token selection automatically
 * <Button consequence="destructive" onClick={handleDelete}>
 *   Delete account
 * </Button>
 *
 * @example
 * // Small ghost button
 * <Button evaluation="muted" size="sm">Learn more</Button>
 */
export const Button = ({
  type = 'button',
  size = 'md',
  ...props
}: ButtonProps) => {
  return <ButtonBase type={type} size={size} {...props} />;
};
