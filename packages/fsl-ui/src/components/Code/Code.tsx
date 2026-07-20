import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colours `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, typography
// `code`. Code renders source text in the monospace type role — inline for a
// token/keyword within prose, or as a scrollable block for a snippet. It reads
// no interactive State.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Code root (Structure entity, monospace text). */
export const codeMeta = {
  displayName: 'Code',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Monospace type step. */
export type CodeSize = 'sm' | 'md';

const TYPE_BY_SIZE: Record<CodeSize, object> = {
  sm: vars.text.code.sm,
  md: vars.text.code.md,
};

/** Props for the Code component. */
export interface CodeProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'style' | 'className'
> {
  /**
   * Render as a scrollable `<pre>` block (`true`) or an inline `<code>` run
   * (`false`). A block gets a bordered surface and its own scroll; inline sits
   * within the surrounding text.
   * @default false
   */
  block?: boolean;
  /**
   * Monospace type step.
   * @default 'sm'
   */
  size?: CodeSize;
  /** The code content. */
  children?: React.ReactNode;
}

/**
 * Source text in the monospace type role.
 *
 * Entity = Structure. Use inline `Code` for a token or keyword inside prose,
 * and `block` for a multi-line snippet — the block is a bordered, scrollable
 * surface. Type comes from the `code` scale; there is no raw font vocabulary.
 *
 * @example
 * ```tsx
 * <Code>npx skills add ttoss/skills --skill fsl</Code>
 * <Code block>{generatedThemeSource}</Code>
 * ```
 */
export const Code = ({
  block = false,
  size = 'sm',
  children,
  ...props
}: CodeProps) => {
  const type = TYPE_BY_SIZE[size] as React.CSSProperties;

  if (!block) {
    return (
      <code {...props} data-scope="code" data-part="root" style={type}>
        {children}
      </code>
    );
  }

  return (
    <pre
      {...props}
      data-scope="code"
      data-part="root"
      data-block="true"
      style={
        {
          margin: 0,
          overflow: 'auto',
          padding: vars.spacing.inset.surface.sm,
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: vars.colors.informational.muted.border?.default,
          color: vars.colors.informational.primary.text?.default,
          backgroundColor:
            vars.colors.informational.primary.background?.default,
          ...type,
        } as React.CSSProperties
      }
    >
      <code>{children}</code>
    </pre>
  );
};
Code.displayName = codeMeta.displayName;
