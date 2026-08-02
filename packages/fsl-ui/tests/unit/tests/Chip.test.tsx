/**
 * Chip — Structure-entity descriptive chip.
 *
 * The interesting assertions are not that it renders: they are that it reads
 * the *informational* palette rather than Feedback's, which is the whole reason
 * it exists as a third component instead of a `Badge` with a neutral
 * evaluation (F-010), and that it cannot drift away from `Badge`'s box.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Badge, Chip, chipMeta } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="chip"][data-part="root"]'
  );
};

describe('Chip', () => {
  test('is a Structure entity — the descriptive chip, not the status one', () => {
    // The identity is the finding. A role chip reports no outcome, so painting
    // it from the Feedback palette would claim one; Structure projects onto
    // `informational`, which is what the colour assertions below pin.
    expect(chipMeta.entity).toBe('Structure');
    expect(chipMeta.structure).toBe('root');
  });

  test('defaults to the muted rung — an annotation, not an object', () => {
    render(<Chip>Admin</Chip>);
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
      render(<Chip evaluation={evaluation}>Beta</Chip>);
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
    // the Studio painted role chips with `Badge evaluation="primary"`, which
    // renders acceptably and means the wrong thing.
    render(<Chip>Admin</Chip>);
    const el = root();
    const feedback = vars.colors.feedback.primary;
    expect(el?.style.backgroundColor).not.toBe(feedback.background!.default);
  });

  test('shares its box with Badge, byte for byte', () => {
    // Two chips side by side in one UI must not be able to disagree about
    // their own roundness. `CHIP_BOX` is the shared source; this asserts the
    // *outcome* rather than the import, so a component that stops reading it
    // fails here even if the module still exists.
    render(
      <>
        <Chip>Admin</Chip>
        <Badge>New</Badge>
      </>
    );
    const chip = root()!;
    const badge = document.querySelector<HTMLElement>(
      '[data-scope="badge"][data-part="root"]'
    )!;

    for (const property of [
      'borderRadius',
      'borderWidth',
      'borderStyle',
      'paddingBlock',
      'paddingInline',
      'fontSize',
      'lineHeight',
    ] as const) {
      expect({ [property]: chip.style[property] }).toEqual({
        [property]: badge.style[property],
      });
    }
  });

  test('is inert — no role, no tabindex, no handlers wired', () => {
    // A descriptive chip is not the interactive `Tag` inside a `TagGroup`.
    // Nothing here should suggest it can be operated.
    render(<Chip>Admin</Chip>);
    const el = root()!;
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('role');
    expect(el).not.toHaveAttribute('tabindex');
  });
});
