/**
 * gapScale — the Structure primitives' shared layout vocabulary (E2 C-12).
 *
 * Pins the step→token identity the three consumers used to spell out
 * privately: every named step resolves the same theme token it did before
 * the records were consolidated, and the alignment keyword maps carry the
 * exact flex/grid spellings. The rendered side of the same contract is held
 * by the Grid/List/Stack suites, which assert the inline styles against
 * `vars` directly — Stack vertical reads `gap.stack`, horizontal reads
 * `gap.inline`.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import type { GapScaleStep } from 'src/tokens/gapScale';
import {
  FLEX_ALIGN,
  FLEX_JUSTIFY,
  GRID_ALIGN,
  INLINE_GAP,
  STACK_GAP,
} from 'src/tokens/gapScale';

const STEPS: GapScaleStep[] = ['xs', 'sm', 'md', 'lg', 'xl'];

describe('gap scale records', () => {
  test.each(STEPS)(
    'STACK_GAP.%s is the gap.stack token (Grid gap, List gap, vertical Stack)',
    (step) => {
      expect(STACK_GAP[step]).toBe(vars.spacing.gap.stack[step]);
    }
  );

  test.each(STEPS)(
    'INLINE_GAP.%s is the gap.inline token (horizontal Stack)',
    (step) => {
      expect(INLINE_GAP[step]).toBe(vars.spacing.gap.inline[step]);
    }
  );

  test('the records cover exactly the five named steps', () => {
    expect(Object.keys(STACK_GAP)).toEqual(STEPS);
    expect(Object.keys(INLINE_GAP)).toEqual(STEPS);
  });
});

describe('alignment keyword maps', () => {
  test('flex alignment spells the flex-* edge keywords', () => {
    expect(FLEX_ALIGN).toEqual({
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    });
  });

  test('flex distribution maps `between` to space-between', () => {
    expect(FLEX_JUSTIFY).toEqual({
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
    });
  });

  test('grid alignment uses the plain keywords, not the flex spellings', () => {
    expect(GRID_ALIGN).toEqual({
      start: 'start',
      center: 'center',
      end: 'end',
      stretch: 'stretch',
    });
  });
});
