/**
 * Badge — Structure-entity descriptive chip.
 *
 * The interesting assertions are not that it renders: they are that it reads
 * the *informational* palette rather than Feedback's, which is the whole reason
 * it exists as a third component instead of a `Badge` with a neutral
 * evaluation (F-010), and that it cannot drift away from `Badge`'s box.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Badge, badgeMeta, StatusLight } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="badge"][data-part="root"]'
  );
};

describe('Badge', () => {
  test('is a Structure entity — the descriptive chip, not the status one', () => {
    // The identity is the finding. A role chip reports no outcome, so painting
    // it from the Feedback palette would claim one; Structure projects onto
    // `informational`, which is what the colour assertions below pin.
    expect(badgeMeta.entity).toBe('Structure');
    expect(badgeMeta.structure).toBe('root');
  });

  test('defaults to the muted rung — an annotation, not an object', () => {
    render(<Badge>Admin</Badge>);
    const el = root();
    expect(el).toHaveAttribute('data-evaluation', 'muted');
    expect(el?.textContent).toBe('Admin');
    expect(el?.style.backgroundColor).toBe(
      vars.colors.informational.muted.background!.default
    );
  });

  test.each(['primary', 'muted'] as const)(
    'evaluation=%s reads the informational palette',
    (evaluation) => {
      render(<Badge evaluation={evaluation}>Beta</Badge>);
      const el = root();
      const colors = vars.colors.informational[evaluation];
      expect(el).toHaveAttribute('data-evaluation', evaluation);
      expect(el?.style.backgroundColor).toBe(colors.background!.default);
      expect(el?.style.borderColor).toBe(colors.border!.default);
      expect(el?.style.color).toBe(colors.text!.default);
    }
  );

  test('reads no Feedback colour at all', () => {
    // The guard that would have caught the workaround this component replaces:
    // the Studio painted role chips with the status pill's neutral evaluation,
    // which renders acceptably and means the wrong thing.
    render(<Badge>Admin</Badge>);
    const el = root();
    const feedback = vars.colors.feedback.primary;
    expect(el?.style.backgroundColor).not.toBe(feedback.background!.default);
  });

  test('no longer shares its box with StatusLight (F-053)', () => {
    // Until F-053 the two were the same silhouette, distinguished only by
    // which colour family they read. StatusLight now renders a dot + label
    // with no fill; Badge keeps the filled `CHIP_BOX` pill. This asserts the
    // *outcome* rather than the import, so a regression that puts the box
    // back under StatusLight's root fails here even if `chipBox.ts` still
    // exists unchanged.
    render(
      <>
        <Badge>Admin</Badge>
        <StatusLight>New</StatusLight>
      </>
    );
    const chip = root()!;
    const statusLight = document.querySelector<HTMLElement>(
      '[data-scope="status-light"][data-part="root"]'
    )!;

    expect(chip.style.borderWidth).not.toBe('');
    expect(chip.style.paddingInline).not.toBe('');
    // The StatusLight root carries none of the pill's chrome any more.
    expect(statusLight.style.borderWidth).toBe('');
    expect(statusLight.style.paddingInline).toBe('');
    expect(statusLight.style.backgroundColor).toBe('');
  });

  test('is inert — no role, no tabindex, no handlers wired', () => {
    // A descriptive chip is not the interactive `Tag` inside a `TagGroup`.
    // Nothing here should suggest it can be operated.
    render(<Badge>Admin</Badge>);
    const el = root()!;
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('role');
    expect(el).not.toHaveAttribute('tabindex');
  });
});
