import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { CHIP_BOX } from '../../tokens/chipBox';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colours `informational`. Badge is the
// **descriptive** member of the chip family: it labels content ("Admin",
// "Beta", "Draft") without reporting an outcome and without being operable.
//
// The name is the reference's. Spectrum splits this axis three ways — Badge
// (metadata) / StatusLight (semantic status) / TagGroup (user-managed) — and so
// does Chakra: Badge (plain span) / Status (indicator) / Tag (compound). Both
// give the *descriptive* chip the word `Badge`. This package shipped it the
// other way round for a while, with `Badge` on the status member; F-040 records
// why that cost more than it looks in an AI-first system, since an agent asked
// for "a role chip" reaches for `Badge` on priors from every other library.
//
// It is a different entity from the other two, not a variant of either: it
// neither reports (Feedback is "the user is the audience of a system-initiated
// outcome", CONTRACT §1.1) nor is operated (Selection). It presents. That is
// Structure, which the FSL Entity Kind Mapping projects onto `informational`.
//
// The distinction is not decorative: painting a valence onto "Admin" claims an
// outcome that does not exist, the same category error the taxonomy blocks when
// it keeps `Evaluation` (authorial) apart from `State.invalid` (runtime).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Badge root (Structure entity, descriptive chip). */
export const badgeMeta = {
  displayName: 'Badge',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Badge component. */
export interface BadgeProps extends Omit<
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
  evaluation?: EvaluationsFor<(typeof badgeMeta)['entity']>;
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
 * | You are showing…                                  | Use           |
 * | ------------------------------------------------- | ------------- |
 * | a descriptive label with no outcome               | `Badge`       |
 * | an outcome or status the system is reporting      | `StatusLight` |
 * | a set the user can select from or remove from     | `TagGroup`    |
 *
 * @example
 * ```tsx
 * <Badge>Admin</Badge>
 * <Badge evaluation="primary">Beta</Badge>
 * ```
 */
export const Badge = ({
  evaluation = 'muted',
  children,
  ...props
}: BadgeProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <span
      {...props}
      data-scope="badge"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          // The box is shared with `StatusLight` — same physical chip,
          // different meaning. Only the colours below are Badge's own.
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
Badge.displayName = badgeMeta.displayName;
