import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  CheckboxGroup as RACCheckboxGroup,
  type CheckboxGroupProps as RACCheckboxGroupProps,
  FieldError as RACFieldError,
  Label as RACLabel,
  Text as RACText,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// CheckboxGroup is the multi-select sibling of RadioGroup: it hosts a set of
// `Checkbox` items and owns the group-level `isInvalid` state, which React
// Aria propagates to every child Checkbox (each reflects the `invalid`
// State). Validation feedback is a runtime State, never an Evaluation.
//
// FRICTION LOG (FSL validation): the ROADMAP lists parts
// `root + label + description + validationMessage`, but the Selection entity's
// structural roles are root/control/label/indicator/selectionControl/item —
// it has NO `description` or `validationMessage` role (those live on Input).
// Per the ROADMAP's "no taxonomy additions" decision, the group's description
// and error are rendered as INTERNAL data-parts (no `*Meta`, so no legality
// claim) — the same way RadioGroup renders its `label` as a prop-driven
// internal part. Only the root (`Selection`/`root`, legal) carries a meta.
// If a future component needs description/validationMessage as *declared*
// Selection identities, admit those roles to `ENTITY_STRUCTURE.Selection` via
// FSL governance then; today the evidence does not justify widening the
// vocabulary. See ROADMAP CheckboxGroup row.
// ---------------------------------------------------------------------------

/** Formal semantic identity — CheckboxGroup root (Selection entity, multi-choice). */
export const checkboxGroupMeta = {
  displayName: 'CheckboxGroup',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

/**
 * Resolve the group's text colors once (default for label/description, invalid
 * for the validation message). Hoisted out of the render so the optional-chain
 * reads live here and keep the component's cyclomatic complexity low.
 */
const resolveGroupTextColors = (
  c: InputColors
): { base: string | undefined; invalid: string | undefined } => {
  const text = c?.text;
  return { base: text?.default, invalid: text?.invalid ?? text?.default };
};

/** Props for the CheckboxGroup component. */
export interface CheckboxGroupProps extends Omit<
  RACCheckboxGroupProps,
  'style' | 'children' | 'className'
> {
  /** Group label displayed above the checkboxes. */
  label?: React.ReactNode;
  /** Supplementary helper text linked to the group via `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Validation message shown when the group is invalid (`isInvalid` /
   * `validate`). Supply caller-localized copy (i18n rule / §6).
   */
  errorMessage?: React.ReactNode;
  /** `Checkbox` option children. */
  children?: React.ReactNode;
}

/**
 * A semantic checkbox group built on React Aria's `CheckboxGroup`.
 *
 * Orchestrates a set of independently-selectable `Checkbox` options (multi
 * select — the counterpart of the single-select `RadioGroup`). Group-level
 * validation set via `isInvalid` (or React Aria's `validate`) propagates to
 * every child Checkbox, which surfaces the `invalid` State.
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`. Validation is the
 * `invalid` State, never an `evaluation` variant.
 *
 * @example
 * ```tsx
 * <CheckboxGroup label="Notifications" description="Pick at least one">
 *   <Checkbox value="email">Email</Checkbox>
 *   <Checkbox value="sms">SMS</Checkbox>
 * </CheckboxGroup>
 * ```
 */
export const CheckboxGroup = ({
  label,
  description,
  errorMessage,
  children,
  ...props
}: CheckboxGroupProps) => {
  const { base, invalid } = resolveGroupTextColors(vars.colors.input.primary);

  return (
    <RACCheckboxGroup
      {...props}
      data-scope="checkbox-group"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.sm,
      }}
    >
      {label != null && (
        <RACLabel
          data-scope="checkbox-group"
          data-part="label"
          style={{
            ...(vars.text.label.md as React.CSSProperties),
            color: base,
          }}
        >
          {label}
        </RACLabel>
      )}
      {children}
      {description != null && (
        <RACText
          slot="description"
          data-scope="checkbox-group"
          data-part="description"
          style={{
            ...(vars.text.label.sm as React.CSSProperties),
            color: base,
          }}
        >
          {description}
        </RACText>
      )}
      <RACFieldError
        data-scope="checkbox-group"
        data-part="validationMessage"
        style={{
          ...(vars.text.label.sm as React.CSSProperties),
          color: invalid,
        }}
      >
        {errorMessage}
      </RACFieldError>
    </RACCheckboxGroup>
  );
};
CheckboxGroup.displayName = checkboxGroupMeta.displayName;
