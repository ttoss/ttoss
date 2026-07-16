import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { Icon } from '../Icon';

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
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

// Static box chrome — flag-independent, hoisted so the render callback only
// computes the state-dependent leaves.
const BOX_STYLE_STATIC = {
  boxSizing: 'border-box',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.125rem',
  height: '1.125rem',
  borderRadius: vars.radii.control,
  borderStyle: vars.border.outline.control.style,
  transitionProperty: 'background-color, border-color, border-width',
  transitionDuration: vars.motion.feedback.duration,
  transitionTimingFunction: vars.motion.feedback.easing,
  outlineOffset: '2px',
} satisfies React.CSSProperties;

/** Box (selectionControl) style — the visual checkbox square. */
const buildBoxStyle = ({
  c,
  isSelected,
  isIndeterminate,
  isInvalid,
  isDisabled,
  isHovered,
  isPressed,
  isFocusVisible,
}: {
  c: InputColors;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  const checkedLike = isSelected || isIndeterminate;
  return {
    ...BOX_STYLE_STATIC,
    borderWidth: checkedLike
      ? vars.border.outline.selected.width
      : vars.border.outline.control.width,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isHovered,
      isPressed,
    }),
    borderColor: resolveInteractiveStyle(c?.border, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isFocusVisible,
    }),
    outline: focusRingOutline(isFocusVisible),
  };
};

/** Indicator glyph color — destructures `text` once to keep `?.` bounded. */
const resolveIndicatorColor = ({
  text,
  isIndeterminate,
}: {
  text: NonNullable<InputColors['text']>;
  isIndeterminate?: boolean;
}): string | undefined => {
  return isIndeterminate
    ? (text.indeterminate ?? text.checked ?? text.default)
    : (text.checked ?? text.default);
};

/** Label color — invalid dominates disabled dominates default. */
const resolveLabelColor = ({
  text,
  isInvalid,
  isDisabled,
}: {
  text: NonNullable<InputColors['text']>;
  isInvalid?: boolean;
  isDisabled?: boolean;
}): string | undefined => {
  if (isInvalid) return text.invalid;
  if (isDisabled) return text.disabled;
  return text.default;
};

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
        const text = c?.text ?? {};
        const showIndicator = isSelected || isIndeterminate;

        return (
          <>
            {/* selectionControl — the visual checkbox box */}
            <span
              data-scope="checkbox"
              data-part="selectionControl"
              aria-hidden
              style={buildBoxStyle({
                c,
                isSelected,
                isIndeterminate,
                isInvalid,
                isDisabled,
                isHovered,
                isPressed,
                isFocusVisible,
              })}
            >
              {/* indicator — checkmark or dash */}
              {showIndicator && (
                <span
                  data-scope="checkbox"
                  data-part="indicator"
                  aria-hidden
                  style={{
                    color: resolveIndicatorColor({ text, isIndeterminate }),
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  <Icon
                    intent={
                      isIndeterminate
                        ? 'selection.indeterminate'
                        : 'selection.checked'
                    }
                    size="sm"
                  />
                </span>
              )}
            </span>

            {/* label */}
            {children != null && (
              <span
                data-scope="checkbox"
                data-part="label"
                style={{
                  color: resolveLabelColor({ text, isInvalid, isDisabled }),
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
