import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';

import type { ComponentMeta } from '../../semantics';
import {
  buildFieldRootStyle,
  buildFieldTextPartStyle,
  fieldSideColumn,
  useFieldLayout,
} from '../Field/anatomy';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row: colors `input.primary`, radii
// `control`, sizing `hit`, spacing `inset.control`, typography `label.md`.
//
// A FieldGroup is a **composite field**: one label over several controls — an
// expiry's month/year pair, a range's from/to. FORMS.md §3 settles why it is
// not a relabelled field: React Aria's label/description contexts are supplied
// by a field ROOT, and a group of fields has no single root to supply them —
// so the envelope here is a `role="group"` region named by `aria-labelledby`,
// and each inner control keeps its own `aria-label` (type discipline cannot
// enforce that; the JSDoc and the story model it).
//
// It is NOT `Group`, and the ADR-014 duplicate test is why that needed
// deciding rather than assuming: `Group` is a labelled *surface* frame
// (`inset.surface`, `radii.surface`, a `title.sm` label — a bordered region of
// content), while FieldGroup is a *field* — the envelope's label step, the
// form's stack rhythm, a subgrid row under `labelPosition="side"` exactly like
// every other field. Same ARIA role, different entity, different job: one
// frames content, the other IS a field whose control happens to be a cluster.
// ---------------------------------------------------------------------------

/** Formal semantic identity — FieldGroup root (Input entity, composite field). */
export const fieldGroupMeta = {
  displayName: 'FieldGroup',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Props for the FieldGroup component. */
export interface FieldGroupProps {
  /**
   * Visible label naming the whole cluster — **required**: the one label over
   * several controls is the reason this component exists. Rendered as a
   * `span` wired via `aria-labelledby`, not a `<label>`: there is no single
   * labelable control for a `<label>` to point at.
   */
  label: React.ReactNode;
  /**
   * The controls — each MUST carry its own `aria-label` (localized, ADR-001),
   * because the group's label names the cluster and screen readers still need
   * each control named individually ("Month", "Year").
   */
  children: React.ReactNode;
  /** Hint text linked to the group via `aria-describedby`. */
  description?: React.ReactNode;
}

/**
 * A composite field: one label over several controls, as a `role="group"`
 * region named by `aria-labelledby` — an expiry's month/year pair, a range's
 * from/to (FORMS.md §2, Level 3).
 *
 * The controls sit in one inline row and share it equally. Inside a
 * `labelPosition="side"` Form the group becomes a subgrid row like any other
 * field: its label joins the shared label column, its controls the control
 * column.
 *
 * Validation stays with each inner field — a group has no validation state of
 * its own, because React Aria's field contexts are supplied per root and the
 * platform validates per control.
 *
 * @example
 * ```tsx
 * <FieldGroup label="Expiry">
 *   <Select aria-label="Expiry month">…</Select>
 *   <Select aria-label="Expiry year">…</Select>
 * </FieldGroup>
 * ```
 */
export const FieldGroup = ({
  label,
  children,
  description,
}: FieldGroupProps) => {
  const { labelPosition } = useFieldLayout();
  const colors = vars.colors.input.primary;
  const ids = React.useId();
  const labelId = `${ids}-label`;
  const descriptionId = description === undefined ? undefined : `${ids}-desc`;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      data-scope="field-group"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      <span
        id={labelId}
        data-scope="field-group"
        data-part="label"
        style={{
          ...buildFieldTextPartStyle({ colors, step: 'md' }),
          ...fieldSideColumn(labelPosition, 'label'),
        }}
      >
        {label}
      </span>
      {/* controls — one inline row, shared equally: a cluster reads as one
          field, so its members split the field's width instead of ragging. */}
      <div
        data-scope="field-group"
        data-part="controls"
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: '1fr',
          gap: vars.spacing.gap.inline.sm,
          ...fieldSideColumn(labelPosition, 'control'),
        }}
      >
        {children}
      </div>
      {description !== undefined && (
        <span
          id={descriptionId}
          data-scope="field-group"
          data-part="description"
          style={{
            ...buildFieldTextPartStyle({ colors, step: 'sm' }),
            ...fieldSideColumn(labelPosition, 'control'),
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
};
FieldGroup.displayName = fieldGroupMeta.displayName;
