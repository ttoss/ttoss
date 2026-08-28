/**
 * actionRow — the committed-actions row's shared arrangement (E2 C-10).
 *
 * Pins the style object `DialogActions`, `FormActions` and
 * `WizardNavigation` used to spell out privately, so the consolidation
 * stays byte-preserving: every property set and every value below is
 * exactly what the three composites emitted before the extraction. The
 * rendered side is held by the DialogActions / formsBridge / Wizard suites.
 *
 * Deliberately NOT pinned to a single rhythm: the action family has two —
 * a group's triggers sit `gap.inline.sm` apart, a committed row's
 * `gap.inline.md` — and whether they converge is an open owner question.
 * The last test keeps that inconsistency visible instead of letting either
 * builder silently absorb the other.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import {
  buildActionGroupStyle,
  buildActionRowStyle,
} from 'src/components/ActionTrigger/anatomy';

describe('buildActionRowStyle', () => {
  test('default shape is the centred band FormActions/WizardNavigation emit', () => {
    expect(buildActionRowStyle({ topGap: vars.spacing.gap.stack.sm })).toEqual({
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: vars.spacing.gap.inline.md,
      marginBlockStart: vars.spacing.gap.stack.sm,
    });
  });

  test('usesFlexDefaults preserves the DialogActions shape: no axis assertions', () => {
    expect(
      buildActionRowStyle({
        topGap: vars.spacing.gap.stack.lg,
        usesFlexDefaults: true,
      })
    ).toEqual({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: vars.spacing.gap.inline.md,
      marginBlockStart: vars.spacing.gap.stack.lg,
    });
  });

  test.each([
    ['start', 'flex-start'],
    ['end', 'flex-end'],
    ['between', 'space-between'],
  ] as const)('align="%s" spells %s (FormActions vocabulary)', (align, css) => {
    expect(
      buildActionRowStyle({ align, topGap: vars.spacing.gap.stack.sm })
        .justifyContent
    ).toBe(css);
  });

  test('the two action rhythms remain distinct: row md, group sm', () => {
    const row = buildActionRowStyle({ topGap: vars.spacing.gap.stack.sm });
    const group = buildActionGroupStyle({ isColumn: false, align: 'end' });
    expect(row.gap).toBe(vars.spacing.gap.inline.md);
    expect(group.gap).toBe(vars.spacing.gap.inline.sm);
    expect(row.gap).not.toBe(group.gap);
  });
});
