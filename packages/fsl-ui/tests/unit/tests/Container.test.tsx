/**
 * Container — Structure-entity page-shell primitive.
 *
 * Verifies the inline-size cap draws from the sizing scale, the gutter from
 * the gutter scale, and the shell centers itself.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Container, type ContainerGutter, type ContainerSize } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="container"][data-part="root"]'
  );
};

describe('Container', () => {
  test('defaults to a centered surface-width shell with page gutter', () => {
    render(
      <Container>
        <i>a</i>
      </Container>
    );
    const el = root();
    expect(el).toHaveAttribute('data-size', 'surface');
    expect(el?.style.marginInline).toBe('auto');
    expect(el?.style.width).toBe('100%');
    expect(el?.style.maxWidth).toBe(vars.sizing.surface.maxWidth);
    expect(el?.style.paddingInline).toBe(vars.spacing.gutter.page);
  });

  test.each<[ContainerSize, string]>([
    ['surface', vars.sizing.surface.maxWidth],
    ['reading', vars.sizing.measure.reading],
  ])('size=%s caps inline size from the sizing scale', (size, css) => {
    render(<Container size={size} />);
    expect(root()?.style.maxWidth).toBe(css);
  });

  test.each<[ContainerGutter, string]>([
    ['none', '0'],
    ['section', vars.spacing.gutter.section],
    ['page', vars.spacing.gutter.page],
  ])('gutter=%s reads the gutter scale', (gutter, css) => {
    render(<Container gutter={gutter} />);
    expect(root()?.style.paddingInline).toBe(css);
  });

  test('forwards pass-through props to the root', () => {
    render(<Container id="page" aria-label="Page" role="main" />);
    const el = root();
    expect(el).toHaveAttribute('id', 'page');
    expect(el).toHaveAttribute('aria-label', 'Page');
    expect(el).toHaveAttribute('role', 'main');
  });
});
