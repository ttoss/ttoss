/**
 * Stack — Structure-entity layout rhythm primitive.
 *
 * Verifies the direction selects the matching gap family (stack vs inline),
 * gap/align/justify draw only from named scales/keywords, and wrap toggles.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  Stack,
  type StackAlign,
  type StackGap,
  type StackJustify,
} from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="stack"][data-part="root"]'
  );
};

describe('Stack', () => {
  test('defaults to a vertical column with md stack gap', () => {
    render(
      <Stack>
        <i>a</i>
      </Stack>
    );
    const el = root();
    expect(el).toHaveAttribute('data-direction', 'vertical');
    expect(el?.style.flexDirection).toBe('column');
    expect(el?.style.gap).toBe(vars.spacing.gap.stack.md);
    expect(el?.style.flexWrap).toBe('nowrap');
  });

  test.each<[StackGap]>([['xs'], ['sm'], ['md'], ['lg'], ['xl']])(
    'vertical gap=%s reads the stack gap scale',
    (gap) => {
      render(
        <Stack gap={gap}>
          <i>a</i>
        </Stack>
      );
      expect(root()?.style.gap).toBe(vars.spacing.gap.stack[gap]);
    }
  );

  test.each<[StackGap]>([['xs'], ['sm'], ['md'], ['lg'], ['xl']])(
    'horizontal gap=%s reads the inline gap scale and rows',
    (gap) => {
      render(
        <Stack direction="horizontal" gap={gap}>
          <i>a</i>
        </Stack>
      );
      const el = root();
      expect(el?.style.flexDirection).toBe('row');
      expect(el?.style.gap).toBe(vars.spacing.gap.inline[gap]);
    }
  );

  test.each<[StackAlign, string]>([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['stretch', 'stretch'],
  ])('align=%s maps to %s', (align, css) => {
    render(
      <Stack align={align}>
        <i>a</i>
      </Stack>
    );
    expect(root()?.style.alignItems).toBe(css);
  });

  test.each<[StackJustify, string]>([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['between', 'space-between'],
  ])('justify=%s maps to %s', (justify, css) => {
    render(
      <Stack justify={justify}>
        <i>a</i>
      </Stack>
    );
    expect(root()?.style.justifyContent).toBe(css);
  });

  test('wrap enables multi-line flow', () => {
    render(
      <Stack wrap>
        <i>a</i>
      </Stack>
    );
    expect(root()?.style.flexWrap).toBe('wrap');
  });

  test('forwards pass-through props to the root', () => {
    render(
      <Stack id="row" aria-label="Row">
        <i>a</i>
      </Stack>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'row');
    expect(el).toHaveAttribute('aria-label', 'Row');
  });
});
