/**
 * Heading — Structure-entity heading bound to the FSL type scale.
 *
 * Verifies rank drives the rendered element, the visual size defaults per rank
 * and can be overridden, and the typography token (not a raw font size) reaches
 * the DOM. Token *values* are the theme's concern; here we assert Heading wires
 * the right scale step per prop.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  Heading,
  type HeadingAlign,
  type HeadingLevel,
  type HeadingSize,
} from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="heading"][data-part="root"]'
  );
};

describe('Heading', () => {
  test.each<[HeadingLevel, string, HeadingSize]>([
    [1, 'H1', 'headline-lg'],
    [2, 'H2', 'headline-md'],
    [3, 'H3', 'title-lg'],
    [4, 'H4', 'title-md'],
    [5, 'H5', 'title-sm'],
    [6, 'H6', 'title-sm'],
  ])('level=%s renders <%s> with its default size', (level, tag, size) => {
    render(<Heading level={level}>Title</Heading>);
    const el = root();
    expect(el?.tagName).toBe(tag);
    expect(el).toHaveAttribute('data-size', size);
    // The default step's font size reached the DOM (no raw literal).
    const [family, step] = size.split('-') as [
      'display' | 'headline' | 'title',
      'lg' | 'md' | 'sm',
    ];
    expect(el?.style.fontSize).toBe(vars.text[family][step].fontSize);
  });

  test('size overrides the rank default without changing the element', () => {
    render(
      <Heading level={2} size="title-sm">
        Small h2
      </Heading>
    );
    const el = root();
    expect(el?.tagName).toBe('H2');
    expect(el).toHaveAttribute('data-size', 'title-sm');
    expect(el?.style.fontSize).toBe(vars.text.title.sm.fontSize);
  });

  test('inherits colour and resets intrinsic margin', () => {
    render(<Heading level={1}>x</Heading>);
    const el = root();
    expect(el?.style.color).toBe('inherit');
    expect(el?.style.margin).toBe('0px');
  });

  test.each<[HeadingAlign]>([['start'], ['center'], ['end']])(
    'align=%s sets text-align',
    (align) => {
      render(
        <Heading level={2} align={align}>
          x
        </Heading>
      );
      expect(root()?.style.textAlign).toBe(align);
    }
  );

  test('forwards pass-through props to the root', () => {
    render(
      <Heading level={3} id="sec" aria-label="Section">
        x
      </Heading>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'sec');
    expect(el).toHaveAttribute('aria-label', 'Section');
  });
});
