import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Label as RACLabel,
  Slider as RACSlider,
  SliderOutput as RACSliderOutput,
  type SliderProps as RACSliderProps,
  SliderThumb as RACSliderThumb,
  SliderTrack as RACSliderTrack,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`, sizing: `hit.base`,
//   spacing: `inset.control`, typography: `label.md`, motion: `feedback`.
//
// FRICTION LOG (FSL validation, ADR-008): the ROADMAP proposed thumb→control,
// track→`surface`, output→`status`. But `Input`'s structural roles are
// root/control/label/description/leadingAdornment/trailingAdornment/
// validationMessage — it has NO `surface` or `status`. Rather than widen the
// vocabulary via FSL §17 (rejected: nominal, unevidenced growth — no runtime
// dispatches on a track/output identity), Slider declares only the root meta
// and renders label/track/fill/thumb/output as INTERNAL data-parts (the
// ProgressBar/Meter/NumberField precedent). The thumb's `data-part="control"`
// uses a legal Input role, so promoting it to a declared meta later is
// non-breaking. See ADR-008.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Slider root (Input entity). */
export const sliderMeta = {
  displayName: 'Slider',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

// Track thickness + thumb diameter (CONTRIBUTING §4 layout-literal rule):
// geometry of the rail and handle, not semantic tokens. The thumb is larger
// than the rail so it reads as a grabbable handle sitting on the track.
const TRACK_THICKNESS = '0.375rem';
const THUMB_SIZE = '1.125rem';

type InputColors = typeof vars.colors.input.primary;

/** Minimal structural view of the RAC SliderState the fill needs. */
type SliderFillState = {
  values: number[];
  getThumbPercent: (index: number) => number;
};

/** The rail the thumb travels along. */
const buildTrackStyle = (c: InputColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    position: 'relative',
    inlineSize: '100%',
    blockSize: TRACK_THICKNESS,
    borderRadius: vars.radii.round,
    backgroundColor: c?.background?.disabled ?? c?.background?.default,
  };
};

/** The filled portion (from the first thumb — or 0 — to the last thumb). */
const buildFillStyle = ({
  c,
  state,
}: {
  c: InputColors;
  state: SliderFillState;
}): React.CSSProperties => {
  const lastIndex = state.values.length - 1;
  const start = state.values.length > 1 ? state.getThumbPercent(0) : 0;
  const end = state.getThumbPercent(lastIndex);
  return {
    position: 'absolute',
    blockSize: '100%',
    insetInlineStart: `${start * 100}%`,
    inlineSize: `${(end - start) * 100}%`,
    borderRadius: 'inherit',
    backgroundColor: c?.border?.checked ?? c?.border?.default,
  };
};

/** The grabbable handle. */
const buildThumbStyle = ({
  c,
  isFocusVisible,
  isDisabled,
}: {
  c: InputColors;
  isFocusVisible?: boolean;
  isDisabled?: boolean;
}): React.CSSProperties => {
  const border = c?.border ?? {};
  const background = c?.background ?? {};
  const key = isDisabled ? 'disabled' : 'default';
  return {
    boxSizing: 'border-box',
    inlineSize: THUMB_SIZE,
    blockSize: THUMB_SIZE,
    borderRadius: vars.radii.round,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    borderColor: border[key],
    backgroundColor: background[key],
    outline: focusRingOutline(isFocusVisible),
  };
};

/** Props for the Slider component. */
export interface SliderProps<T extends number | number[] = number> extends Omit<
  RACSliderProps<T>,
  'style' | 'className' | 'children'
> {
  /** Visible label displayed above the track. */
  label?: React.ReactNode;
  /**
   * Whether to render the current value(s) next to the label (RAC
   * `SliderOutput`, locale-formatted via `formatOptions`).
   * @default true
   */
  showOutput?: boolean;
}

/**
 * A semantic slider built on React Aria's `Slider` — select one value (or a
 * range) along a track. Entity = Input → reads `vars.colors.input.primary.*`.
 * Supports `minValue`/`maxValue`/`step`, `orientation`, locale-aware
 * `formatOptions`, and multiple thumbs (pass an array value for a range).
 * Keyboard + RTL handling come from React Aria.
 *
 * @example
 * ```tsx
 * <Slider label="Volume" defaultValue={50} />
 * <Slider label="Price" defaultValue={[20, 80]} formatOptions={{ style: 'currency', currency: 'USD' }} />
 * ```
 */
export const Slider = <T extends number | number[] = number>({
  label,
  showOutput = true,
  ...props
}: SliderProps<T>) => {
  const c = vars.colors.input.primary;

  return (
    <RACSlider
      {...props}
      data-scope="slider"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
      }}
    >
      {(label != null || showOutput) && (
        <div
          data-scope="slider"
          data-part="labelRow"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            color: c?.text?.default,
            ...(vars.text.label.md as React.CSSProperties),
          }}
        >
          {label != null && (
            <RACLabel data-scope="slider" data-part="label">
              {label}
            </RACLabel>
          )}
          {showOutput && (
            <RACSliderOutput data-scope="slider" data-part="status" />
          )}
        </div>
      )}

      <RACSliderTrack
        data-scope="slider"
        data-part="track"
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          blockSize: THUMB_SIZE,
          inlineSize: '100%',
        }}
      >
        {({ state }) => {
          return (
            <div style={buildTrackStyle(c)}>
              <div
                data-scope="slider"
                data-part="fill"
                style={buildFillStyle({ c, state })}
              />
              {state.values.map((_, index) => {
                return (
                  <RACSliderThumb
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    index={index}
                    data-scope="slider"
                    data-part="control"
                    style={({ isFocusVisible, isDisabled }) => {
                      return buildThumbStyle({ c, isFocusVisible, isDisabled });
                    }}
                  />
                );
              })}
            </div>
          );
        }}
      </RACSliderTrack>
    </RACSlider>
  );
};
Slider.displayName = sliderMeta.displayName;
