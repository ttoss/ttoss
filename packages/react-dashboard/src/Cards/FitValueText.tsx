import { Text } from '@ttoss/ui';
import * as React from 'react';

/** The theme's `2xl`, used when the computed size cannot be read in pixels. */
const FALLBACK_MAX_FONT_SIZE_PX = 24;

/** Below this a big number stops reading as the card's headline. */
export const MIN_FIT_FONT_SIZE_PX = 14;

const readFontSizePx = (element: HTMLElement) => {
  const value = window.getComputedStyle(element).fontSize;
  return value.endsWith('px') ? parseFloat(value) : FALLBACK_MAX_FONT_SIZE_PX;
};

/**
 * Shrinks the element's font until its single line fits its width, never
 * below `MIN_FIT_FONT_SIZE_PX`. A value that fits keeps the theme size.
 */
export const fitFontSize = (element: HTMLElement) => {
  element.style.fontSize = '';
  if (element.scrollWidth <= element.clientWidth) {
    return;
  }
  const fitted = Math.floor(
    (readFontSizePx(element) * element.clientWidth) / element.scrollWidth
  );
  element.style.fontSize = `${Math.max(MIN_FIT_FONT_SIZE_PX, fitted)}px`;
};

type FitValueTextProps = {
  /** The formatted value, shown on one line. */
  children: string;
  /** Text color token. */
  color: string;
};

/**
 * A card's headline value on one line, shrunk to the card's width when it is
 * longer than the card (a currency value in a two-column phone grid); the
 * full value stays in its `title`.
 */
export const FitValueText = ({ children, color }: FitValueTextProps) => {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    fitFontSize(element);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      fitFontSize(element);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [children]);

  return (
    <Text
      ref={ref}
      title={children}
      sx={{
        display: 'block',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color,
        fontSize: '2xl',
        fontWeight: 'semibold',
        lineHeight: 'shorter',
      }}
    >
      {children}
    </Text>
  );
};
