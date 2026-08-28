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
import { fslVar } from '../../tokens/escapeHatch';
import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import {
  buildRailLabelRowStyle,
  RAIL_FILL,
  RAIL_ROOT_STYLE,
  TRACK_RAIL,
} from '../../tokens/rail';
import { SELECTION_CONTROL } from '../../tokens/selectionControl';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`, sizing: `hit`,
//   spacing: `inset.control`, typography: `label.md`, motion: `feedback`.
//
// FRICTION LOG (FSL validation, ADR-008): the ROADMAP proposed thumb→control,
// track→`surface`, output→`status`. But `Input`'s structural roles are
// root/control/label/description/leadingAdornment/trailingAdornment/
// validationMessage — it has NO `surface` or `status`. Rather than widen the
// vocabulary via FSL §17 (rejected: nominal, unevidenced growth — no runtime
// dispatches on a track/output identity), Slider declares only the root meta
// and renders label/track/fill/thumb/handle/output as INTERNAL data-parts
// (the ProgressBar/Meter/NumberField precedent). The thumb's
// `data-part="control"` uses a legal Input role, so promoting it to a
// declared meta later is non-breaking. See ADR-008. `sizing: hit` above is
// read by the track and by the thumb's interactive box (it was a written
// claim nothing read until forms item E).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Slider root (Input entity). */
export const sliderMeta = {
  displayName: 'Slider',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

// Rail thickness comes from the shared rail (`TRACK_RAIL`) — the third copy of
// P3 slice 3's "three rails, one answer" ruling, which had been written out as
// `'0.375rem'` here and `'6px'` twice in `Feedback` (deliberately kept over
// S2's 4px: the three rails are one internal decision). Only the thickness is
// shared: `RAIL_BASE` clips its fill, and this rail must not — the thumb
// overflows it on purpose. The visible handle takes the shared
// selection-control scale (18px) so it reads as a grabbable knob on the rail;
// its *interactive* box is `sizing.hit` — see the thumb below.

type InputColors = typeof vars.colors.input.primary;

/** Minimal structural view of the RAC SliderState the fill needs. */
type SliderFillState = {
  values: number[];
  getThumbPercent: (index: number) => number;
};

/**
 * The rail the thumb travels along.
 *
 * The fill is the cross-cutting `RAIL_FILL` (`semantic.rail.track`) every
 * rail shares, not `c?.background?.disabled` — that borrow made an empty
 * `Slider` mean "disabled" in the token model (F-051). `Slider`'s own
 * `background` states (`checked`/`default`) are unaffected; only the rail
 * behind the fill moved off the borrowed state token.
 */
const buildTrackStyle = (): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    position: 'relative',
    inlineSize: '100%',
    blockSize: TRACK_RAIL.thickness,
    borderRadius: vars.radii.round,
    backgroundColor: RAIL_FILL,
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

/**
 * The **interactive** thumb box — `sizing.hit` on both axes, which is what
 * makes the header's `sizing: hit` claim true (it was written and read by
 * nothing) and what clears WCAG 2.5.8 Target Size (AA, 24×24): the previous
 * thumb was its own 18px visual, a pointer target below the floor, and 2.5.8's
 * spacing exception cannot rescue a range slider's two adjacent thumbs. The
 * same fill-vs-target split `EMBEDDED_TRIGGER` records: the box is the target,
 * the visible handle inside it is the fill. On a coarse pointer `hit` steps to
 * 48px, which is also the direction the reference moves (handle 20 → 24px on
 * mobile).
 *
 * `insetBlockStart: 50%` pins the box's centre to the rail's centre — React
 * Aria positions the thumb with `left: n%` + `translate(-50%, -50%)` and
 * leaves the block axis to the caller (its own examples write `top: 50%`).
 */
const buildThumbStyle = (): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    insetBlockStart: '50%',
    inlineSize: vars.sizing.hit,
    blockSize: vars.sizing.hit,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
};

/** The visible handle — the fill inside the interactive box. */
const buildHandleStyle = ({
  c,
  isFocusVisible,
  isDisabled,
}: {
  c: InputColors;
  isFocusVisible?: boolean;
  isDisabled?: boolean;
}): React.CSSProperties => {
  const border = c?.border;
  const background = c?.background;
  const key = isDisabled ? 'disabled' : 'default';
  return {
    boxSizing: 'border-box',
    flexShrink: 0,
    inlineSize: SELECTION_CONTROL.size,
    blockSize: SELECTION_CONTROL.size,
    borderRadius: vars.radii.round,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    borderColor: border?.[key],
    backgroundColor: background?.[key],
    // The ring wraps the visible handle, not the invisible target — a ring
    // around a transparent 32px box floats detached from what it marks.
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: FOCUS_RING_OFFSET,
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
      style={RAIL_ROOT_STYLE}
    >
      {(label != null || showOutput) && (
        <div
          data-scope="slider"
          data-part="labelRow"
          // The shared row, with Input's own quiet text — the ink is the
          // parametrized axis, not a normalized colour (Feedback's rails
          // read their entity's quiet text instead).
          style={buildRailLabelRowStyle({ ink: c?.text?.default })}
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
          // The row's ergonomic floor: tall enough to host the hit-sized
          // thumb, and the same block size a field control clears.
          blockSize: vars.sizing.hit,
          inlineSize: '100%',
          // Host knob (CONTRACT.md §7), shared with `ProgressBar`/`Meter`'s
          // rail (F-052) — unset by default, so this row fills its container
          // exactly as before.
          maxWidth: fslVar('--fsl-track-max-width', TRACK_RAIL.maxWidth),
        }}
      >
        {({ state }) => {
          return (
            <div style={buildTrackStyle()}>
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
                    style={buildThumbStyle()}
                  >
                    {({ isFocusVisible, isDisabled }) => {
                      return (
                        <span
                          data-scope="slider"
                          data-part="handle"
                          aria-hidden
                          style={buildHandleStyle({
                            c,
                            isFocusVisible,
                            isDisabled,
                          })}
                        />
                      );
                    }}
                  </RACSliderThumb>
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
