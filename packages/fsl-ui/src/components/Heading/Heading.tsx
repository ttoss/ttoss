import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: typography `title` (and the larger
// `headline`/`display` steps of the same scale). Heading is the primitive that
// binds a document heading (`<h1>`…`<h6>`) to the theme's type scale, so a
// heading can never be sized by a raw `font-size`. Colour is inherited (a
// heading reads the text colour of the Surface it sits on), so it consumes no
// colour token and stays composable on any surface.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Heading root (Structure entity, heading text). */
export const headingMeta = {
  displayName: 'Heading',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Heading rank — sets the rendered `<h1>`…`<h6>` element and the default size. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** A step of the heading type scale (`{family}-{step}`). */
export type HeadingSize =
  | 'display-lg'
  | 'display-md'
  | 'display-sm'
  | 'headline-lg'
  | 'headline-md'
  | 'headline-sm'
  | 'title-lg'
  | 'title-md'
  | 'title-sm';

/** Typography token per heading size — the scale reaches the DOM only here. */
const TYPE_BY_SIZE: Record<HeadingSize, object> = {
  'display-lg': vars.text.display.lg,
  'display-md': vars.text.display.md,
  'display-sm': vars.text.display.sm,
  'headline-lg': vars.text.headline.lg,
  'headline-md': vars.text.headline.md,
  'headline-sm': vars.text.headline.sm,
  'title-lg': vars.text.title.lg,
  'title-md': vars.text.title.md,
  'title-sm': vars.text.title.sm,
};

/**
 * Default visual size per rank. Rank drives document structure (a11y); `size`
 * can override the visual step independently so heading order stays correct
 * even when the design wants a smaller-looking `<h2>`.
 */
const DEFAULT_SIZE_BY_LEVEL: Record<HeadingLevel, HeadingSize> = {
  1: 'headline-lg',
  2: 'headline-md',
  3: 'title-lg',
  4: 'title-md',
  5: 'title-sm',
  6: 'title-sm',
};

/** Props for the Heading component. */
export interface HeadingProps extends Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  'style' | 'className'
> {
  /**
   * Heading rank — renders the matching `<h1>`…`<h6>`. Choose it for document
   * structure and screen-reader navigation, not for visual size.
   */
  level: HeadingLevel;
  /**
   * Visual size from the heading type scale, overriding the rank's default.
   * Use it to decouple appearance from rank (e.g. a visually small `<h2>`).
   */
  size?: HeadingSize;
  /** The heading text. */
  children?: React.ReactNode;
}

/**
 * A document heading bound to the FSL type scale.
 *
 * Entity = Structure. `level` sets the `<h1>`…`<h6>` element (structure and
 * accessibility); `size` optionally overrides the visual step. There is no way
 * to pass a raw font size — the scale is the only vocabulary — which is how the
 * theme's typography reaches the screen consistently. Colour is inherited from
 * the surrounding surface.
 *
 * @example
 * ```tsx
 * <Heading level={1}>Billing</Heading>
 * <Heading level={2} size="title-md">Payment methods</Heading>
 * ```
 */
export const Heading = ({ level, size, children, ...props }: HeadingProps) => {
  const resolvedSize = size ?? DEFAULT_SIZE_BY_LEVEL[level];
  const Tag = `h${level}` as const;

  return (
    <Tag
      {...props}
      data-scope="heading"
      data-part="root"
      data-size={resolvedSize}
      style={
        {
          margin: 0,
          color: 'inherit',
          ...TYPE_BY_SIZE[resolvedSize],
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
};
Heading.displayName = headingMeta.displayName;
