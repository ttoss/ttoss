/**
 * StatusLight — Feedback-entity status indicator.
 *
 * Verifies the dot reads the evaluation's feedback colour, the label carries
 * no fill or pill chrome (F-053 — the dot-plus-label silhouette, not the
 * pill `Badge` still uses), tabular numerals toggle, and the label renders.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { StatusLight, type StatusLightNumeric } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="status-light"][data-part="root"]'
  );
};

const dot = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="status-light"] [data-part="dot"]'
  );
};

const label = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="status-light"] [data-part="label"]'
  );
};

describe('StatusLight', () => {
  test('defaults to the primary feedback evaluation', () => {
    render(<StatusLight>New</StatusLight>);
    const el = root();
    expect(el).toHaveAttribute('data-evaluation', 'primary');
    expect(el?.textContent).toBe('New');
    expect(dot()?.style.backgroundColor).toBe(
      vars.colors.feedback.primary.background!.default
    );
  });

  test.each(['primary', 'positive', 'caution', 'negative'] as const)(
    'evaluation=%s paints the dot with the feedback palette',
    (evaluation) => {
      render(<StatusLight evaluation={evaluation}>x</StatusLight>);
      expect(dot()?.style.backgroundColor).toBe(
        vars.colors.feedback[evaluation].background!.default
      );
    }
  );

  test('the label reads the page ink, not the feedback valence', () => {
    // The reference publishes no `status-light-text` colour token — the dot
    // alone carries the valence. A label painted from the feedback palette
    // would be the old pill's colour claim leaking onto the new silhouette.
    render(<StatusLight evaluation="negative">Fail</StatusLight>);
    expect(label()?.style.color).toBe(
      vars.colors.informational.primary.text!.default
    );
    expect(label()?.style.color).not.toBe(
      vars.colors.feedback.negative.text!.default
    );
  });

  test('the root carries no pill chrome — no fill, no border, no padding', () => {
    // The guard for F-053: if a regression puts `CHIP_BOX` back under this
    // root, every one of these goes from empty to a resolved value.
    render(<StatusLight evaluation="positive">Passing</StatusLight>);
    const el = root()!;
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.borderWidth).toBe('');
    expect(el.style.borderStyle).toBe('');
    expect(el.style.borderColor).toBe('');
    expect(el.style.paddingInline).toBe('');
    expect(el.style.paddingBlock).toBe('');
  });

  test('the dot is a fixed-size circle, independent of the label', () => {
    render(<StatusLight evaluation="caution">Degraded</StatusLight>);
    const el = dot()!;
    expect(el.style.width).toBe(el.style.height);
    expect(el.style.borderRadius).toBe(vars.radii.round);
  });

  test.each<[StatusLightNumeric, string]>([
    ['normal', ''],
    ['tabular', 'tabular-nums'],
  ])('numeric=%s controls tabular figures on the label', (numeric, css) => {
    render(<StatusLight numeric={numeric}>5.1:1</StatusLight>);
    expect(label()?.style.fontVariantNumeric).toBe(css);
  });

  test('forwards pass-through props to the root', () => {
    render(
      <StatusLight id="tag" role="status">
        x
      </StatusLight>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'tag');
    expect(el).toHaveAttribute('role', 'status');
  });
});
