/**
 * Code — Structure-entity monospace text.
 *
 * Verifies inline renders a <code>, block renders a scrollable <pre>, and the
 * type step comes from the code scale.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Code, type CodeSize } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="code"][data-part="root"]'
  );
};

describe('Code', () => {
  test('renders an inline <code> by default', () => {
    render(<Code>npm i</Code>);
    const el = root();
    expect(el?.tagName).toBe('CODE');
    expect(el).not.toHaveAttribute('data-block');
    expect(el?.textContent).toBe('npm i');
  });

  test('block renders a scrollable <pre> surface', () => {
    render(<Code block>const x = 1;</Code>);
    const el = root();
    expect(el?.tagName).toBe('PRE');
    expect(el).toHaveAttribute('data-block', 'true');
    expect(el?.style.overflow).toBe('auto');
    expect(el?.style.padding).toBe(vars.spacing.inset.surface.sm);
    // The snippet is wrapped in a <code> for semantics.
    expect(el?.querySelector('code')?.textContent).toBe('const x = 1;');
  });

  test.each<[CodeSize]>([['sm'], ['md']])(
    'size=%s reads the code type scale',
    (size) => {
      render(<Code size={size}>x</Code>);
      expect(root()?.style.fontFamily).toBe(
        (vars.text.code[size] as { fontFamily: string }).fontFamily
      );
    }
  );

  test('forwards pass-through props to the root', () => {
    render(
      <Code block id="snippet" data-testid="snip">
        x
      </Code>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'snippet');
    expect(el).toHaveAttribute('data-testid', 'snip');
  });
});
