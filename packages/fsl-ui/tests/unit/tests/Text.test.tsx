/**
 * Text — Structure-entity running copy / labels bound to the FSL type scale.
 *
 * Verifies the variant selects the right scale step, `tone` builds hierarchy
 * (muted vs inherited colour), and `as` chooses the element. Token *values*
 * are the theme's concern; here we assert Text wires the right token per prop.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Text, type TextAs, type TextTone, type TextVariant } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="text"][data-part="root"]'
  );
};

describe('Text', () => {
  test('renders a paragraph with body-md defaults', () => {
    render(<Text>Copy</Text>);
    const el = root();
    expect(el?.tagName).toBe('P');
    expect(el).toHaveAttribute('data-variant', 'body-md');
    expect(el).toHaveAttribute('data-tone', 'default');
    expect(el?.style.color).toBe('inherit');
    expect(el?.style.fontSize).toBe(vars.text.body.md.fontSize);
  });

  test.each<[TextVariant, 'body' | 'label', 'lg' | 'md' | 'sm']>([
    ['body-lg', 'body', 'lg'],
    ['body-md', 'body', 'md'],
    ['body-sm', 'body', 'sm'],
    ['label-lg', 'label', 'lg'],
    ['label-md', 'label', 'md'],
    ['label-sm', 'label', 'sm'],
  ])('variant=%s draws from the %s.%s scale step', (variant, family, step) => {
    render(<Text variant={variant}>x</Text>);
    expect(root()?.style.fontSize).toBe(vars.text[family][step].fontSize);
  });

  test.each<[TextTone, string]>([
    ['default', 'inherit'],
    ['muted', vars.colors.informational.muted.text?.default ?? ''],
  ])('tone=%s sets the text colour', (tone, expected) => {
    render(<Text tone={tone}>x</Text>);
    expect(root()?.style.color).toBe(expected);
  });

  test.each<[TextAs, string]>([
    ['p', 'P'],
    ['span', 'SPAN'],
    ['div', 'DIV'],
  ])('as=%s renders <%s>', (as, tag) => {
    render(<Text as={as}>x</Text>);
    expect(root()?.tagName).toBe(tag);
  });

  test('forwards pass-through props to the root', () => {
    render(
      <Text id="copy" aria-label="Copy">
        x
      </Text>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'copy');
    expect(el).toHaveAttribute('aria-label', 'Copy');
  });
});
