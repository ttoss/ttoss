import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: typography `body`/`label`, colours
// `informational`. Text is the primitive that binds running copy and labels to
// the theme's type scale, so body text can never be sized by a raw
// `font-size`. `tone` optionally reads the muted informational text colour for
// secondary copy (captions, hints) — the one lever that builds text hierarchy;
// by default colour is inherited from the surrounding surface.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Text root (Structure entity, body/label text). */
export const textMeta = {
  displayName: 'Text',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * A step of the body/label type scale (`{family}-{step}`). `display-sm` is
 * the stat step: display-scale figures that are *data*, not document
 * headings (KPI values, prices) — admitted on the Dashboard/Pricing blocks'
 * evidence (friction F-014).
 */
export type TextVariant =
  | 'display-sm'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'label-lg'
  | 'label-md'
  | 'label-sm';

/** The tone of the text colour — default inherits; `muted` recedes. */
export type TextTone = 'default' | 'muted';

/** Inline text alignment. */
export type TextAlign = 'start' | 'center' | 'end';

/** Numeric figure style — `tabular` aligns digits in columns (metrics, tables). */
export type TextNumeric = 'normal' | 'tabular';

/** The element Text renders as. */
export type TextAs = 'p' | 'span' | 'div';

/** Typography token per variant — the scale reaches the DOM only here. */
const TYPE_BY_VARIANT: Record<TextVariant, object> = {
  'display-sm': vars.text.display.sm,
  'body-lg': vars.text.body.lg,
  'body-md': vars.text.body.md,
  'body-sm': vars.text.body.sm,
  'label-lg': vars.text.label.lg,
  'label-md': vars.text.label.md,
  'label-sm': vars.text.label.sm,
};

/** Props for the Text component. */
export interface TextProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'style' | 'className'
> {
  /**
   * Step of the body/label type scale. `body-*` is running copy; `label-*` is
   * the tighter, slightly heavier form for field labels and captions.
   * @default 'body-md'
   */
  variant?: TextVariant;
  /**
   * Colour tone. `default` inherits the surrounding surface's text colour;
   * `muted` recedes to the muted informational text colour for secondary copy.
   * @default 'default'
   */
  tone?: TextTone;
  /**
   * Inline alignment (`text-align`). A layout keyword, not a design token.
   * @default 'start'
   */
  align?: TextAlign;
  /**
   * Numeric figure style. `tabular` renders `tabular-nums` so digits occupy
   * equal width — use it for metrics, counts, and any figures that must line up
   * in a column. A rendering *meaning*, not a raw style.
   * @default 'normal'
   */
  numeric?: TextNumeric;
  /**
   * The element to render. `p` for paragraphs, `span` for inline runs, `div`
   * for grouping.
   * @default 'p'
   */
  as?: TextAs;
  /** The text content. */
  children?: React.ReactNode;
}

/** Muted text colour; `default` tone inherits (no colour set). */
const colorForTone = (tone: TextTone): string | undefined => {
  return tone === 'muted'
    ? vars.colors.informational.muted.text?.default
    : 'inherit';
};

/**
 * Running copy and labels bound to the FSL type scale.
 *
 * Entity = Structure. `variant` picks the step of the body/label scale — there
 * is no raw font-size vocabulary, which is how the theme's typography reaches
 * the screen consistently. `tone="muted"` is the sanctioned way to build text
 * hierarchy (secondary copy recedes); otherwise colour is inherited from the
 * surface.
 *
 * @example
 * ```tsx
 * <Text>Your changes are saved automatically.</Text>
 * <Text variant="label-md" tone="muted">Last updated 2 minutes ago</Text>
 * ```
 */
export const Text = ({
  variant = 'body-md',
  tone = 'default',
  align = 'start',
  numeric = 'normal',
  as = 'p',
  children,
  ...props
}: TextProps) => {
  const Tag = as;

  return (
    <Tag
      {...props}
      data-scope="text"
      data-part="root"
      data-variant={variant}
      data-tone={tone}
      style={
        {
          margin: 0,
          color: colorForTone(tone),
          textAlign: align,
          fontVariantNumeric:
            numeric === 'tabular' ? 'tabular-nums' : undefined,
          ...TYPE_BY_VARIANT[variant],
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
};
Text.displayName = textMeta.displayName;
