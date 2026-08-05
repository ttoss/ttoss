/**
 * The rail contract (F-050, F-051) — P3 review round 3.
 *
 * A rail is the thin pill track a value travels along: `ProgressBar`'s
 * activity bar, `Meter`'s level bar, `Slider`'s range track. P3 slice 3 ruled
 * "three rails, one answer" and then the ruling was written out three times,
 * in two units — so these assertions pin the *source*, not the number.
 *
 * The colour half is the one that had a user-visible defect behind it. Both
 * `Feedback` rails read the entity's quiet **border**, which the dark
 * alternate remaps *lighter* (an edge must stay visible on a dark canvas) to
 * exactly `feedback.primary.background`'s dark value — so
 * `<ProgressBar evaluation="primary" />` painted a uniform grey rail with no
 * visible fill. Nothing failed: the theme's pairing suites audit an edge
 * against its own role's fill and ink against backgrounds, and this pair is a
 * *fill against another role's edge* — the F-043/F-044 asymmetry a third time.
 *
 * So the rail-fill assertions are written from both sides: the quiet surface
 * is read, and the quiet border is **not**. Asserting only the first would let
 * a refactor put the border back through a different path.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Meter, ProgressBar, Slider } from 'src/index';
import { FEEDBACK_RAIL_FILL, RAIL_BASE, TRACK_RAIL } from 'src/tokens/rail';

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

describe('a Feedback rail reads the entity quiet surface, not its border', () => {
  test('the shared fill is the quiet surface', () => {
    expect(FEEDBACK_RAIL_FILL).toBe(
      vars.colors.feedback.muted.background?.default
    );
    // The half that matters: the border is what shipped, and in dark it
    // resolved to `feedback.primary.background`'s own value (F-050).
    expect(FEEDBACK_RAIL_FILL).not.toBe(
      vars.colors.feedback.muted.border?.default
    );
  });

  test('both rails paint it', () => {
    render(
      <>
        <ProgressBar label="Uploading" value={40} />
        <Meter label="Storage" value={40} />
      </>
    );

    expect(railOf('progress-bar').style.backgroundColor).toBe(
      FEEDBACK_RAIL_FILL
    );
    expect(railOf('meter').style.backgroundColor).toBe(FEEDBACK_RAIL_FILL);
  });

  test('the fill stays the evaluation surface, so the pair is fill-vs-rail', () => {
    render(<ProgressBar label="Uploading" value={40} evaluation="positive" />);

    const fill = document.querySelector<HTMLElement>(
      '[data-scope="progress-bar"][data-part="content"]'
    );
    expect(fill?.style.backgroundColor).toBe(
      vars.colors.feedback.positive.background?.default
    );
    expect(fill?.style.backgroundColor).not.toBe(FEEDBACK_RAIL_FILL);
  });
});
