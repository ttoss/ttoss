/**
 * StatusLight — Feedback-entity status pill.
 *
 * Verifies the evaluation drives the feedback palette, tabular numerals toggle,
 * and the label renders.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { StatusLight, type StatusLightNumeric } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="status-light"][data-part="root"]'
  );
};

describe('StatusLight', () => {
  test('defaults to the primary feedback evaluation', () => {
    render(<StatusLight>New</StatusLight>);
    const el = root();
    expect(el).toHaveAttribute('data-evaluation', 'primary');
    expect(el?.textContent).toBe('New');
    expect(el?.style.backgroundColor).toBe(
      vars.colors.feedback.primary.background!.default
    );
  });

  test.each(['primary', 'positive', 'caution', 'negative'] as const)(
    'evaluation=%s reads the feedback palette',
    (evaluation) => {
      render(<StatusLight evaluation={evaluation}>x</StatusLight>);
      const el = root();
      expect(el?.style.color).toBe(
        vars.colors.feedback[evaluation].text!.default
      );
      expect(el?.style.backgroundColor).toBe(
        vars.colors.feedback[evaluation].background!.default
      );
    }
  );

  test.each<[StatusLightNumeric, string]>([
    ['normal', ''],
    ['tabular', 'tabular-nums'],
  ])('numeric=%s controls tabular figures', (numeric, css) => {
    render(<StatusLight numeric={numeric}>5.1:1</StatusLight>);
    expect(root()?.style.fontVariantNumeric).toBe(css);
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
