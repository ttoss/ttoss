import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`,
//   border: `outline.control` (default) + `selected` (when checked/indeterminate),
//   sizing: `hit.base`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback is a **runtime State** (`invalid`), driven by React
// Aria's `isInvalid` and surfaced by the `invalid` token column. It is not
// an authorial Evaluation. See `taxonomy.ts` design note on
// `ENTITY_EVALUATION` for the full rationale.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Checkbox root (Selection entity, toggle.binary). */
export const checkboxMeta = {
  displayName: 'Checkbox',
  entity: 'Selection',
  structure: 'root',
  interaction: 'toggle.binary',
} as const satisfies ComponentMeta<'Selection'>;

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps extends Omit<
  RACCheckboxProps,
  'style' | 'children'
> {
  /**
   * Label content displayed next to the checkbox indicator.
   * Rendered inside a `data-part="label"` span.
   */
  children?: React.ReactNode;
}

/**
 * A semantic selection checkbox built on React Aria.
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`. Validation
 * feedback is rendered via the `invalid` State (driven by React Aria's
 * `isInvalid` prop or form-library validation), not via an Evaluation
 * variant.
 *
 * @example
 * ```tsx
 * <Checkbox>Accept terms</Checkbox>
 * <Checkbox isInvalid>Accept terms (must be checked)</Checkbox>
 * <Checkbox isIndeterminate>Partially selected</Checkbox>
 * ```
 */
export const Checkbox = ({ children, ...props }: CheckboxProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACCheckbox
      {...props}
      data-scope="checkbox"
      data-part="root"
      style={({ isDisabled }) => {
        return {
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          gap: vars.spacing.gap.inline.sm,
          minHeight: vars.sizing.hit.base,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          ...(vars.text.label.md as React.CSSProperties),
          color: isDisabled ? c?.text?.disabled : c?.text?.default,
        } as React.CSSProperties;
      }}
    >
      {({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
        isIndeterminate,
        isInvalid,
      }) => {
        const borderWidth =
          isSelected || isIndeterminate
            ? vars.border.selected.width
            : vars.border.outline.control.width;

        const bgColor = resolveInteractiveStyle(c?.background, {
          isDisabled,
          isInvalid,
          isSelected,
          isIndeterminate,
          isHovered,
          isPressed,
        });

        const borderColor = resolveInteractiveStyle(c?.border, {
          isDisabled,
          isInvalid,
          isSelected,
          isIndeterminate,
          isFocusVisible,
        });

        const indicatorColor = isIndeterminate
          ? (c?.text?.indeterminate ?? c?.text?.checked ?? c?.text?.default)
          : (c?.text?.checked ?? c?.text?.default);

        return (
          <>
            {/* selectionControl — the visual checkbox box */}
            <span
              data-scope="checkbox"
              data-part="selectionControl"
              aria-hidden
              style={{
                boxSizing: 'border-box',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.125rem',
                height: '1.125rem',
                borderRadius: vars.radii.control,
                borderWidth,
                borderStyle: vars.border.outline.control.style,
                backgroundColor: bgColor,
                borderColor,
                transitionProperty:
                  'background-color, border-color, border-width',
                transitionDuration: vars.motion.feedback.duration,
                transitionTimingFunction: vars.motion.feedback.easing,
                outline: isFocusVisible
                  ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
                  : 'none',
                outlineOffset: '2px',
              }}
            >
              {/* indicator — checkmark or dash */}
              {(isSelected || isIndeterminate) && (
                <span
                  data-scope="checkbox"
                  data-part="indicator"
                  aria-hidden
                  style={{
                    color: indicatorColor,
                    fontSize: '0.75em',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  {isIndeterminate ? '−' : '✓'}
                </span>
              )}
            </span>

            {/* label */}
            {children != null && (
              <span
                data-scope="checkbox"
                data-part="label"
                style={{
                  color: isInvalid
                    ? c?.text?.invalid
                    : isDisabled
                      ? c?.text?.disabled
                      : c?.text?.default,
                }}
              >
                {children}
              </span>
            )}
          </>
        );
      }}
    </RACCheckbox>
  );
};
Checkbox.displayName = checkboxMeta.displayName;
