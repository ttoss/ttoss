import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { CHIP_BOX } from '../../tokens/chipBox';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colours `informational`. Chip is the
// **descriptive** member of the chip family: it labels content ("Admin",
// "Beta", "Draft") without reporting an outcome and without being operable.
//
// Why a third component rather than a prop on an existing one. Both reference
// systems split this axis three ways, and we already shipped two of the three:
// Spectrum has Badge (metadata) / StatusLight (semantic status) / TagGroup
// (user-managed); Chakra has Badge (plain span) / Status (indicator) / Tag
// (compound, close trigger). Our `Badge` is Feedback — it is the *status*
// member, the one Spectrum calls StatusLight — and our `Tag` is Selection, the
// item inside a `TagGroup`. The static descriptive chip was the missing middle.
//
// It is a different entity from both, not a variant of either: it neither
// reports (Feedback is "the user is the audience of a system-initiated
// outcome", CONTRACT §1.1) nor is operated (Selection). It presents. That is
// Structure, which the FSL Entity Kind Mapping projects onto `informational`.
//
// The distinction is not decorative: painting a valence onto "Admin" claims an
// outcome that does not exist, the same category error the taxonomy blocks when
// it keeps `Evaluation` (authorial) apart from `State.invalid` (runtime).
//
// Naming, recorded because it diverges from both references (F-040): they call
// this member `Badge` and give the status member another name. Ours are
// inverted, and the names were already published, so the third member takes the
// free word rather than a rename cascading through the catalog.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Chip root (Structure entity, descriptive chip). */
export const chipMeta = {
  displayName: 'Chip',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Chip component. */
export interface ChipProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'style' | 'className'
> {
  /**
   * Presentational emphasis. `muted` is the resting descriptive chip — a filled
   * surface that recedes into the page. `primary` promotes it to the page's own
   * surface with a hairline edge, for a chip that must read as an object rather
   * than as an annotation.
   * @default 'muted'
   */
  evaluation?: EvaluationsFor<(typeof chipMeta)['entity']>;
  /** The chip label. */
  children?: React.ReactNode;
}

/**
 * A compact descriptive chip — a label for content, carrying no outcome.
 *
 * Entity = Structure. Use it for categories, roles and attributes: "Admin",
 * "Beta", "TypeScript". It is not interactive and it reports nothing.
 *
 * Pick between the three chips by what the colour is saying:
 *
 * | You are showing…                                  | Use        |
 * | ------------------------------------------------- | ---------- |
 * | a descriptive label with no outcome               | `Chip`     |
 * | an outcome or status the system is reporting      | `Badge`    |
 * | a set the user can select from or remove from     | `TagGroup` |
 *
 * @example
 * ```tsx
 * <Chip>Admin</Chip>
 * <Chip evaluation="primary">Beta</Chip>
 * ```
 */
export const Chip = ({
  evaluation = 'muted',
  children,
  ...props
}: ChipProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <span
      {...props}
      data-scope="chip"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          // The box is shared with `Badge` — same physical chip, different
          // meaning. Only the colours below are Chip's own.
          ...CHIP_BOX,
          borderColor: colors?.border?.default,
          color: colors?.text?.default,
          backgroundColor: colors?.background?.default,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
};
Chip.displayName = chipMeta.displayName;
