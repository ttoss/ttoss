import { render, screen } from '@ttoss/test-utils/react';
import {
  fitFontSize,
  FitValueText,
  MIN_FIT_FONT_SIZE_PX,
} from 'src/Cards/FitValueText';

const sized = ({
  scrollWidth,
  clientWidth,
  fontSize = '24px',
}: {
  scrollWidth: number;
  clientWidth: number;
  fontSize?: string;
}) => {
  const element = document.createElement('span');
  Object.defineProperty(element, 'scrollWidth', { value: scrollWidth });
  Object.defineProperty(element, 'clientWidth', { value: clientWidth });
  jest.spyOn(window, 'getComputedStyle').mockReturnValue({
    fontSize,
  } as CSSStyleDeclaration);
  return element;
};

afterEach(() => {
  jest.restoreAllMocks();
});

test('a value that fits keeps the theme size', () => {
  const element = sized({ scrollWidth: 120, clientWidth: 150 });
  element.style.fontSize = '10px';

  fitFontSize(element);

  expect(element.style.fontSize).toBe('');
});

test('a value wider than the card shrinks in proportion', () => {
  const element = sized({ scrollWidth: 200, clientWidth: 150 });

  fitFontSize(element);

  expect(element.style.fontSize).toBe('18px');
});

test('a value never shrinks below the minimum', () => {
  const element = sized({ scrollWidth: 600, clientWidth: 150 });

  fitFontSize(element);

  expect(element.style.fontSize).toBe(`${MIN_FIT_FONT_SIZE_PX}px`);
});

test('a size that is not in pixels falls back to the theme 2xl', () => {
  const element = sized({
    scrollWidth: 200,
    clientWidth: 100,
    fontSize: '1.5rem',
  });

  fitFontSize(element);

  expect(element.style.fontSize).toBe('14px');
});

test('renders the value on one line with the full value as its title', () => {
  render(<FitValueText color="text">R$ 1.234.567,89</FitValueText>);

  expect(screen.getByText('R$ 1.234.567,89')).toHaveAttribute(
    'title',
    'R$ 1.234.567,89'
  );
});
