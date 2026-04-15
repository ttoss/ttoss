import type {
  IconifyIcon,
  IconifyIconHTMLElement,
  IconifyIconProps,
} from '@iconify-icon/react';
import { Icon as IconComponent } from '@iconify-icon/react';
import * as React from 'react';

export type IconType = string | IconifyIcon;

export type IconProps = Omit<IconifyIconProps, 'ref'>;

export type { IconifyIcon };

export const Icon = React.forwardRef<IconifyIconHTMLElement | null, IconProps>(
  (props, ref) => {
    return <IconComponent ref={ref} data-testid="iconify-icon" {...props} />;
  }
);

Icon.displayName = 'Icon';

// ---------------------------------------------------------------------------
// SemanticIcon
// ---------------------------------------------------------------------------

type UseIconGlyph = (intent: string) => string;

let _useIconGlyph: UseIconGlyph | null = null;

/**
 * Wires `SemanticIcon` to a `useIconGlyph` implementation.
 * Call this once at app startup when using `@ttoss/theme2`.
 *
 * @example
 * ```ts
 * import { registerIconGlyphResolver } from '@ttoss/react-icons';
 * import { useIconGlyph } from '@ttoss/theme2/react';
 *
 * registerIconGlyphResolver(useIconGlyph);
 * ```
 */
export const registerIconGlyphResolver = (fn: UseIconGlyph): void => {
  _useIconGlyph = fn;
};

export type SemanticIconProps = {
  intent: string;
} & Omit<IconProps, 'icon'>;

export const SemanticIcon = React.forwardRef<
  IconifyIconHTMLElement | null,
  SemanticIconProps
>(({ intent, ...props }, ref) => {
  if (!_useIconGlyph) {
    throw new Error(
      'SemanticIcon requires a registered glyph resolver. ' +
        'Call registerIconGlyphResolver(useIconGlyph) at app startup.'
    );
  }
  const glyph = _useIconGlyph(intent);
  return <Icon ref={ref} icon={glyph} {...props} />;
});

SemanticIcon.displayName = 'SemanticIcon';
