import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  Switch as RACSwitch,
  type SwitchProps as RACSwitchProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `round` (track + thumb = pill shape),
//   border: `outline.control`, sizing: `hit.base`,
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
  interaction: 'toggle.binary',
} as const satisfies ComponentMeta<'Selection'>;

// Track and thumb geometry (layout constants — not semantic tokens).
const TRACK_W = '2.5rem';
const TRACK_H = '1.5rem';
const THUMB_SIZE = '1.125rem';
// Offset = (trackH - thumbSize) / 2 ≈ 0.1875rem
const THUMB_OFFSET = '0.1875rem';

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
 * sizing: `hit.base`, motion: `feedback`.
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
          minHeight: vars.sizing.hit.base,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          ...(vars.text.label.md as React.CSSProperties),
          color: isDisabled ? c?.text?.disabled : c?.text?.default,
        } as React.CSSProperties;
      }}
    >
      {({ isHovered, isPressed, isDisabled, isFocusVisible, isSelected }) => {
        // Track background: default (off) → checked (on)
        const trackBg = resolveInteractiveStyle(c?.background, {
          isDisabled,
          isSelected,
          isHovered,
          isPressed,
        });

        const trackBorderColor = resolveInteractiveStyle(c?.border, {
          isDisabled,
          isSelected,
          isFocusVisible,
        });

        // Thumb color:
        //   ON  → c?.text?.checked  (typically neutral.0 = white on brand bg)
        //   OFF → c?.border?.default (typically neutral.300 = visible on light track)
        const thumbColor = isSelected
          ? (c?.text?.checked ?? c?.text?.default)
          : c?.border?.default;

        // Thumb left position — slides right when ON
        const thumbLeft = isSelected
          ? `calc(${TRACK_W} - ${THUMB_SIZE} - ${THUMB_OFFSET})`
          : THUMB_OFFSET;

        return (
          <>
            {/* control — the sliding track */}
            <span
              data-scope="switch"
              data-part="control"
              aria-hidden
              style={{
                boxSizing: 'border-box',
                position: 'relative',
                flexShrink: 0,
                display: 'inline-block',
                width: TRACK_W,
                height: TRACK_H,
                borderRadius: vars.radii.round,
                borderWidth: vars.border.outline.control.width,
                borderStyle: vars.border.outline.control.style,
                backgroundColor: trackBg,
                borderColor: trackBorderColor,
                transitionProperty: 'background-color, border-color',
                transitionDuration: vars.motion.feedback.duration,
                transitionTimingFunction: vars.motion.feedback.easing,
                outline: isFocusVisible
                  ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
                  : 'none',
                outlineOffset: '2px',
              }}
            >
              {/* indicator — the sliding thumb */}
              <span
                data-scope="switch"
                data-part="indicator"
                aria-hidden
                style={{
                  position: 'absolute',
                  top: THUMB_OFFSET,
                  left: thumbLeft,
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: vars.radii.round,
                  backgroundColor: thumbColor,
                  transitionProperty: 'left, background-color',
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
                style={{
                  color: isDisabled ? c?.text?.disabled : c?.text?.default,
                }}
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
