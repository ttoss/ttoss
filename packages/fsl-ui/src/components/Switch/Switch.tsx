import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Switch as RACSwitch,
  type SwitchProps as RACSwitchProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `round` (track + thumb = pill shape),
//   border: `outline.control`, sizing: `hit`,
//   spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Switches are not validated by React Aria — a binary on/off toggle has no
// validation outcome to surface (the user can always flip it). The `invalid`
// state is therefore not consumed here even though it is legal for
// `toggle.binary` (Checkbox uses it).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Switch root (Selection entity, toggle.binary). */
export const switchMeta = {
  displayName: 'Switch',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

// Track and thumb geometry (layout constants — not semantic tokens).
const TRACK_W = '2.5rem';
const TRACK_H = '1.5rem';
const THUMB_SIZE = '1.125rem';
// Offset = (trackH - thumbSize) / 2 ≈ 0.1875rem
const THUMB_OFFSET = '0.1875rem';

type InputColors = typeof vars.colors.input.primary;

const TRACK_STYLE_STATIC = {
  boxSizing: 'border-box',
  position: 'relative',
  flexShrink: 0,
  display: 'inline-block',
  width: TRACK_W,
  height: TRACK_H,
  borderRadius: vars.radii.round,
  borderWidth: vars.border.outline.control.width,
  borderStyle: vars.border.outline.control.style,
  transitionProperty: 'background-color, border-color',
  transitionDuration: vars.motion.feedback.duration,
  transitionTimingFunction: vars.motion.feedback.easing,
  outlineOffset: '2px',
} satisfies React.CSSProperties;

/** Sliding-track style (state-dependent background/border + focus ring). */
const buildTrackStyle = ({
  c,
  isDisabled,
  isSelected,
  isHovered,
  isPressed,
  isFocusVisible,
}: {
  c: InputColors;
  isDisabled?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  return {
    ...TRACK_STYLE_STATIC,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isSelected,
      isHovered,
      isPressed,
    }),
    borderColor: resolveInteractiveStyle(c?.border, {
      isDisabled,
      isSelected,
      isFocusVisible,
    }),
    outline: focusRingOutline(isFocusVisible),
  };
};

/**
 * Thumb color:
 *   ON  → text.checked (typically neutral.0 = white on brand track)
 *   OFF → border.default (typically neutral.300 = visible on light track)
 */
const resolveThumbColor = ({
  c,
  isSelected,
}: {
  c: InputColors;
  isSelected?: boolean;
}): string | undefined => {
  const text = c?.text;
  return isSelected ? (text?.checked ?? text?.default) : c?.border?.default;
};

/** Label color — disabled dominates default (Selection has no evaluation). */
const resolveLabelColor = ({
  c,
  isDisabled,
}: {
  c: InputColors;
  isDisabled?: boolean;
}): string | undefined => {
  const text = c?.text;
  return isDisabled ? text?.disabled : text?.default;
};

/**
 * Props for the Switch component.
 */
export interface SwitchProps extends Omit<
  RACSwitchProps,
  'style' | 'children'
> {
  /**
   * Label content displayed next to the switch track.
   * Rendered inside a `data-part="label"` span.
   */
  children?: React.ReactNode;
}

/**
 * A semantic on/off toggle built on React Aria's Switch.
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`, radii: `round`
 * (pill track + circular thumb), border: `outline.control`,
 * sizing: `hit`, motion: `feedback`.
 *
 * @example
 * ```tsx
 * <Switch>Enable notifications</Switch>
 * <Switch defaultSelected>Dark mode</Switch>
 * ```
 */
export const Switch = ({ children, ...props }: SwitchProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACSwitch
      {...props}
      data-scope="switch"
      data-part="root"
      style={({ isDisabled }) => {
        return {
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          gap: vars.spacing.gap.inline.sm,
          minHeight: vars.sizing.hit,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          ...(vars.text.label.md as React.CSSProperties),
          color: isDisabled ? c?.text?.disabled : c?.text?.default,
        } as React.CSSProperties;
      }}
    >
      {({ isHovered, isPressed, isDisabled, isFocusVisible, isSelected }) => {
        // Thumb inline-start position — slides toward inline-end when ON.
        // Logical property: under `dir="rtl"` the thumb correctly slides
        // left instead of right.
        const thumbInsetInlineStart = isSelected
          ? `calc(${TRACK_W} - ${THUMB_SIZE} - ${THUMB_OFFSET})`
          : THUMB_OFFSET;

        return (
          <>
            {/* control — the sliding track */}
            <span
              data-scope="switch"
              data-part="control"
              aria-hidden
              style={buildTrackStyle({
                c,
                isDisabled,
                isSelected,
                isHovered,
                isPressed,
                isFocusVisible,
              })}
            >
              {/* indicator — the sliding thumb */}
              <span
                data-scope="switch"
                data-part="indicator"
                aria-hidden
                style={{
                  position: 'absolute',
                  insetBlockStart: THUMB_OFFSET,
                  insetInlineStart: thumbInsetInlineStart,
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: vars.radii.round,
                  backgroundColor: resolveThumbColor({ c, isSelected }),
                  transitionProperty: 'inset-inline-start, background-color',
                  transitionDuration: vars.motion.feedback.duration,
                  transitionTimingFunction: vars.motion.feedback.easing,
                }}
              />
            </span>

            {/* label */}
            {children != null && (
              <span
                data-scope="switch"
                data-part="label"
                style={{ color: resolveLabelColor({ c, isDisabled }) }}
              >
                {children}
              </span>
            )}
          </>
        );
      }}
    </RACSwitch>
  );
};
Switch.displayName = switchMeta.displayName;
