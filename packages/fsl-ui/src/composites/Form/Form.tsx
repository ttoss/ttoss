import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Form as RACForm,
  type FormProps as RACFormProps,
} from 'react-aria-components';

import { Button, type ButtonProps } from '../../components/Button/Button';
import type {
  ComponentMeta,
  CompositionsFor,
  ConsequencesFor,
} from '../../semantics';
import { createPresenceScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — presence-only host guard.
//
// `Form` is the host. `FormActions` and `FormSubmit` assert this scope at
// render time — rendered standalone they throw with a clear message instead
// of silently producing a submit button or actions row that is detached from
// any form's validation/submission contract.
// ---------------------------------------------------------------------------

const formScope = createPresenceScope('Form');

// ---------------------------------------------------------------------------
// Form — host (Structure entity, structure: 'root')
//
// A Form is the semantic scope under which Input / Selection / Action
// entities coordinate around a single validation + submission contract.
// It is NOT an Input or an Overlay: its identity is purely organizational,
// which makes `Structure` the right entity (organizational frame that
// carries other content).
//
// Validation feedback at the composite level does not need a new mechanism:
// React Aria's `<Form>` propagates `validationErrors` to nested fields by
// `name`, each nested TextField / Select surfaces its `State.invalid`
// through the existing `resolveInteractiveStyle` cascade. The Form root
// emits no `data-state` of its own — state lives on the individual parts.
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — Form root (Structure entity, root part).
 */
export const formMeta = {
  displayName: 'Form',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for the Form component.
 *
 * The Form root carries no `evaluation` prop: under the evidence rule
 * (CONTRIBUTING §2.3) a dimension only appears on a component if a runtime
 * dispatches on it. The Form root is visually transparent — colors,
 * spacing of authorial emphasis live on the nested Input / Action parts —
 * so adding `evaluation` here would be reserving API surface for a
 * speculative future consumer. Re-introduce it the day a real consumer
 * (e.g. background card chrome) needs it.
 *
 * The composite owns its layout; pass `style`/`className` on a wrapping
 * element rather than on the composite root. See CONTRIBUTING §4.
 */
export interface FormProps extends Omit<RACFormProps, 'style' | 'className'> {
  /**
   * Form content — typically TextField / Select / Checkbox / RadioGroup
   * composites plus a {@link FormActions} row at the end.
   */
  children?: React.ReactNode;
}

/**
 * A semantic form scope built on React Aria's native `Form`.
 *
 * Coordinates nested Input / Selection / Action parts around a single
 * submission and validation contract. Field-level `State.invalid` is driven
 * by React Aria's `validationErrors` propagation — this component adds no
 * state machinery of its own.
 *
 * Entity = Structure. The root is visually transparent — only
 * `vars.spacing.gap.stack.md` between children. No color tokens are read
 * here; chrome lives on the nested input / action parts.
 *
 * @example
 * ```tsx
 * <Form onSubmit={(e) => { e.preventDefault(); … }}>
 *   <TextField name="email" isRequired>
 *     <TextFieldLabel>Email</TextFieldLabel>
 *     <TextFieldControl type="email" />
 *     <TextFieldError />
 *   </TextField>
 *   <FormActions>
 *     <Button type="reset" evaluation="muted">Reset</Button>
 *     <FormSubmit>Save</FormSubmit>
 *   </FormActions>
 * </Form>
 * ```
 */
export const Form = ({ children, ...props }: FormProps) => {
  return (
    <formScope.Provider>
      <RACForm
        {...props}
        data-scope="form"
        data-part="root"
        style={
          {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: vars.spacing.gap.stack.md,
            ...(vars.text.label.md as React.CSSProperties),
          } as React.CSSProperties
        }
      >
        {children}
      </RACForm>
    </formScope.Provider>
  );
};
Form.displayName = formMeta.displayName;

// ---------------------------------------------------------------------------
// FormActions — actions slot (Structure entity)
//
// A semantic container for submit / reset / cancel buttons at the end of a
// form. `structure: 'actions'` is the intrinsic structural role (this part
// IS an actions row); `composition: 'supporting'` is the relational slot it
// plays inside the parent Form (supporting the primary input content). The
// two DIVERGE here, which is the piece of evidence the Menu composite
// couldn't produce.
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — supporting action row slot within a Form.
 */
export const formActionsMeta = {
  displayName: 'FormActions',
  entity: 'Structure',
  structure: 'actions',
  composition: 'supporting',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Props for the FormActions component.
 */
export interface FormActionsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Alignment of the action row. Defaults to end-alignment which matches
   * the platform convention for submit-on-the-right layouts.
   * @default 'end'
   */
  align?: 'start' | 'end' | 'between';
  /**
   * Action buttons — typically a {@link FormSubmit} plus optional reset /
   * cancel Buttons.
   */
  children?: React.ReactNode;
}

const justifyMap = {
  start: 'flex-start',
  end: 'flex-end',
  between: 'space-between',
} as const;

/**
 * A horizontal row for a Form's action buttons (submit, cancel, reset).
 *
 * The `composition: 'supporting'` slot tags this row as supplementary to
 * the Form's primary input content — host CSS or future composites may
 * target `[data-composition="supporting"]` for layout variants.
 */
export const FormActions = ({
  align = 'end',
  children,
  ...props
}: FormActionsProps) => {
  formScope.use(formActionsMeta.displayName);
  return (
    <div
      {...props}
      data-scope="form"
      data-part="actions"
      data-composition="supporting"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: justifyMap[align],
          gap: vars.spacing.gap.inline.md,
          marginBlockStart: vars.spacing.gap.stack.sm,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
FormActions.displayName = formActionsMeta.displayName;

// ---------------------------------------------------------------------------
// FormSubmit — commit action (Action entity)
//
// A submit-typed Action whose default Consequence is `'committing'` — the
// second real Consequence consumer in the catalog (after MenuItem's
// `destructive`). Crucially, its default value DIFFERS from MenuItem's:
// this validates that the Consequence dimension actually carries distinct
// authorial values, not just one constant.
// ---------------------------------------------------------------------------

/**
 * Formal semantic identity — the primary commit action inside a Form.
 */
export const formSubmitMeta = {
  displayName: 'FormSubmit',
  entity: 'Action',
  structure: 'root',
  composition: 'primaryAction',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Props for the FormSubmit component.
 *
 * Wraps {@link Button} — inherits every Button prop except `type` (always
 * `"submit"`) and reassigns semantic defaults. `consequence`, `composition`,
 * and `isPending` are surfaced explicitly because their defaults differ
 * from Button's.
 */
export interface FormSubmitProps extends Omit<ButtonProps, 'type'> {
  /**
   * Effect on state. Emitted as `data-consequence`; not used for coloring
   * (visual distinction, if any, is a theme / host-CSS concern — same
   * contract as `MenuItem`).
   * @default 'committing'
   */
  consequence?: ConsequencesFor<(typeof formSubmitMeta)['entity']>;
  /**
   * Composition slot within the Form. Emitted as `data-composition` for
   * host CSS / tests / future composites.
   * @default 'primaryAction'
   */
  composition?: CompositionsFor<(typeof formSubmitMeta)['entity']>;
  /**
   * Whether the form is currently submitting. When true, the button is
   * disabled to prevent double-submit and emits `data-pending` for host
   * CSS (spinner, skeleton). Host-controlled — ui2 does not own the
   * submission lifecycle.
   */
  isPending?: boolean;
}

/**
 * The primary commit button inside a {@link Form}.
 *
 * A thin wrapper around {@link Button} that fixes `type="submit"` and
 * reassigns defaults so the commit-happy path is free of boilerplate:
 * `consequence="committing"` (second real Consequence callsite with a
 * value distinct from `MenuItem`'s typical `destructive` / `neutral`) and
 * `composition="primaryAction"` (advertises the slot to host layout CSS).
 *
 * Visual styling is inherited from `Button`; FormSubmit adds no chrome.
 * The only extra DOM signal it layers on is `data-composition` and
 * `data-pending` when `isPending` is true.
 *
 * Entity = Action → same token row as `Button` (`vars.colors.action.*`).
 */
export const FormSubmit = ({
  consequence = 'committing',
  composition = 'primaryAction',
  isPending = false,
  isDisabled,
  ...props
}: FormSubmitProps) => {
  formScope.use(formSubmitMeta.displayName);
  return (
    <Button
      {...props}
      type="submit"
      data-scope="form-submit"
      consequence={consequence}
      isDisabled={isDisabled ?? isPending}
      data-composition={composition}
      data-pending={isPending || undefined}
    />
  );
};
FormSubmit.displayName = formSubmitMeta.displayName;
