/**
 * The rail contract (F-050, F-051, F-052) — P3 review round 3, resolved.
 *
 * A rail is the thin pill track a value travels along: `ProgressBar`'s
 * activity bar, `Meter`'s level bar, `Slider`'s range track. P3 slice 3 ruled
 * "three rails, one answer" and then the ruling was written out three times,
 * in two units — so the geometry assertions pin the *source*, not the number.
 *
 * The colour half (F-050/F-051) had a user-visible defect behind it, twice.
 * `ProgressBar`/`Meter` first read the entity's quiet **border**, which the
 * dark alternate remaps *lighter* (an edge must stay visible on a dark
 * canvas) to exactly `feedback.primary.background`'s dark value — a uniform
 * grey rail with no visible fill (F-050). The fix moved them to
 * `feedback.muted.background`, and `Slider` still read
 * `input.primary.background.disabled` — a *state* standing in for a *part*,
 * so an empty `Slider` rail meant "disabled" in the token model. F-051 gives
 * the rail its own cross-cutting address (`semantic.rail.track`,
 * `@ttoss/fsl-theme`); all three components now read the same `RAIL_FILL`.
 *
 * So the rail-fill assertions are written from both sides: the shared
 * address is read, and neither borrowed token is. Asserting only the first
 * would let a refactor put either borrow back through a different path.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Meter, ProgressBar, Slider } from 'src/index';
import { RAIL_BASE, RAIL_FILL, TRACK_RAIL } from 'src/tokens/rail';

const railOf = (scope: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    `[data-scope="${scope}"][data-part="body"]`
  );
  if (!el) {
    throw new Error(`no rail rendered for ${scope}`);
  }
  return el;
};

/**
 * The Slider's rail is an unnamed div between its hit-sized `track` row and
 * its `fill`, so it is reached through the fill rather than by `data-part`.
 * Naming it would be a published-attribute change and this round did not need
 * one; the thickness is what the shared source owns.
 */
const sliderRail = (): HTMLElement => {
  const fill = document.querySelector<HTMLElement>(
    '[data-scope="slider"][data-part="fill"]'
  );
  const rail = fill?.parentElement;
  if (!rail) {
    throw new Error('no slider rail rendered');
  }
  return rail;
};

const sliderTrackRow = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="slider"][data-part="track"]'
  );
  if (!el) {
    throw new Error('no slider track row rendered');
  }
  return el;
};

describe('the rail is one silhouette across the three components that have one', () => {
  test('ProgressBar, Meter and Slider all read the shared thickness', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
        <Slider label="Volume" defaultValue={40} />
      </>
    );

    expect(railOf('progress-bar').style.height).toBe(TRACK_RAIL.thickness);
    expect(railOf('meter').style.height).toBe(TRACK_RAIL.thickness);
    // Slider states the rail on the logical axis; same source, same value.
    expect(sliderRail().style.blockSize).toBe(TRACK_RAIL.thickness);
  });

  test('the two Feedback rails take the shared floor the reference sets', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
      </>
    );

    // Without it a rail declared `width: 100%` collapses toward zero in a
    // narrow cell and stops carrying a proportion (F-051).
    expect(railOf('progress-bar').style.minWidth).toBe(TRACK_RAIL.minWidth);
    expect(railOf('meter').style.minWidth).toBe(TRACK_RAIL.minWidth);
  });

  // The discriminant. `RAIL_BASE` clips its fill to the pill, which is right
  // for a rail whose fill is a bar and wrong for one whose thumb overflows it.
  test('the shared base clips, and the Slider rail deliberately does not', () => {
    expect(RAIL_BASE.overflow).toBe('hidden');

    render(<Slider label="Volume" defaultValue={40} />);
    expect(sliderRail().style.overflow).toBe('');
  });
});

describe('all three rails read the cross-cutting rail fill, not a borrowed role token (F-050/F-051)', () => {
  test('the shared fill is the cross-cutting semantic.rail.track address', () => {
    expect(RAIL_FILL).toBe(vars.rail.track);

    // Neither borrow this ruling closed. `ProgressBar`/`Meter` shipped
    // `feedback.muted.background` (F-050's fix, a better borrow but still
    // one); `Slider` shipped `input.primary.background.disabled` (a state
    // standing in for a part). Comparing the `var()` reference itself — not
    // a resolved colour — means this fails even where a coincidence in the
    // resolved value would not show it.
    expect(RAIL_FILL).not.toBe(vars.colors.feedback.muted.background?.default);
    expect(RAIL_FILL).not.toBe(vars.colors.feedback.muted.border?.default);
    expect(RAIL_FILL).not.toBe(vars.colors.input.primary.background?.disabled);
  });

  test('all three components paint it', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
        <Slider label="Volume" defaultValue={40} />
      </>
    );

    expect(railOf('progress-bar').style.backgroundColor).toBe(RAIL_FILL);
    expect(railOf('meter').style.backgroundColor).toBe(RAIL_FILL);
    // Closes F-051's actual defect: an empty Slider no longer reads the
    // Input entity's `disabled` state token for its rail.
    expect(sliderRail().style.backgroundColor).toBe(RAIL_FILL);
    expect(sliderRail().style.backgroundColor).not.toBe(
      vars.colors.input.primary.background?.disabled
    );
  });

  test('the fill stays the evaluation surface, so the pair is fill-vs-rail', () => {
    render(<ProgressBar label="Uploading" value={40} evaluation="positive" />);

    const fill = document.querySelector<HTMLElement>(
      '[data-scope="progress-bar"][data-part="content"]'
    );
    expect(fill?.style.backgroundColor).toBe(
      vars.colors.feedback.positive.background?.default
    );
    expect(fill?.style.backgroundColor).not.toBe(RAIL_FILL);
  });
});

describe('the rail width ceiling is an opt-in host knob, not a default (F-052)', () => {
  test('unset by default — every rail keeps its fluid width', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
        <Slider label="Volume" defaultValue={40} />
      </>
    );

    const unsetKnob = 'var(--fsl-track-max-width, none)';
    expect(railOf('progress-bar').style.maxWidth).toBe(unsetKnob);
    expect(railOf('meter').style.maxWidth).toBe(unsetKnob);
    expect(sliderTrackRow().style.maxWidth).toBe(unsetKnob);

    // The floor from ADR-033/F-052 is unaffected — only the ceiling is new.
    expect(railOf('progress-bar').style.width).toBe('100%');
    expect(railOf('meter').style.width).toBe('100%');
  });

  test('every rail reads the same knob name, so one host rule caps all three', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
        <Slider label="Volume" defaultValue={40} />
      </>
    );

    const KNOB = /^var\(--fsl-track-max-width,/;
    expect(railOf('progress-bar').style.maxWidth).toMatch(KNOB);
    expect(railOf('meter').style.maxWidth).toMatch(KNOB);
    expect(sliderTrackRow().style.maxWidth).toMatch(KNOB);
  });
});
