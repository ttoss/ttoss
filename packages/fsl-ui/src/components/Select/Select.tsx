import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  Popover as RACPopover,
  Select as RACSelect,
  type SelectProps as RACSelectProps,
  SelectValue,
  type SelectValueRenderProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  buildFieldControlStyle,
  buildFieldRootStyle,
  FieldDescriptionPart,
  FieldLabelPart,
  FieldValidationMessagePart,
} from '../Field/anatomy';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control` + `selected`,
//   sizing: `hit`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback is driven by React Aria's `isInvalid` (or `validate`
// callback) and surfaces via the `invalid` token State on the trigger.
//
// FRICTION LOG (F-009, closed here). `Select` had nowhere to render a message:
// it could turn its trigger red and no more, so the Studio's invite form
// hand-assembled a live region under it. The parts land the same way
// `CheckboxGroup`'s did — the Selection entity's structural roles are
// root/control/label/indicator/selectionControl/item, with **no** `description`
// or `validationMessage` (those are Input's), so both ship as INTERNAL
// data-parts carrying no `*Meta` and therefore claiming no legality. React Aria
// makes them work regardless: `Select` provides `TextContext` with
// `description`/`errorMessage` slots and a `FieldErrorContext` holding its real
// validation state (read in `Select.mjs`), which is why `FieldError` renders
// here while on a lone `Checkbox` it could not. Widening
// `ENTITY_STRUCTURE.Selection` stays a governance decision for the day a
// component needs these as *declared* identities; today the evidence does not
// justify it, and this is the second component to reach that same answer.
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const selectMeta = {
  displayName: 'Select',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

// eslint-disable-next-line react-refresh/only-export-components
export const selectItemMeta = {
  displayName: 'SelectItem',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

/** Dropdown popover surface style — Selection-entity chrome. */
const buildPopoverStyle = (c: InputColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    borderRadius: vars.radii.control,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    borderColor: c?.border?.default,
    backgroundColor: c?.background?.default,
    overflow: 'hidden',
  };
};

// ---------------------------------------------------------------------------
// Select — root orchestrator
// ---------------------------------------------------------------------------

/**
 * Props for the Select component.
 */
export interface SelectProps<T extends object = object> extends Omit<
  RACSelectProps<T>,
  'style' | 'children'
> {
  /** Label displayed above the trigger button. */
  label?: React.ReactNode;
  /** Supplementary helper text linked to the field via `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Validation message shown when the field is invalid. Supply
   * caller-localized copy (i18n rule / §6). Leave it out and the platform's own
   * constraint message is shown instead — already localized, and the better
   * copy for a required field.
   */
  errorMessage?: React.ReactNode;
  /**
   * Placeholder shown in the trigger when no value is selected.
   *
   * Ships a documented English fallback (`'Select…'`) — the placeholder is
   * supplementary hint text, not a flow-critical label (CONTRIBUTING §6 /
   * ADR-001). Localized hosts should still supply their own copy.
   * @default 'Select…'
   */
  placeholder?: string;
  /** `SelectItem` children rendered inside the dropdown ListBox. */
  children?: React.ReactNode;
}

/**
 * A semantic dropdown selection built on React Aria.
 *
 * Composes a trigger `Button`, a floating `Popover`, and a `ListBox`.
 * Use `SelectItem` for each option.
 *
 * Entity = Selection, interaction = `select.single`. Validation feedback is
 * driven by React Aria's `isInvalid` and surfaces on the trigger via the
 * `invalid` token State — and, since F-009 closed, in a `validationMessage`
 * part, so an invalid choice can state why inside the system.
 *
 * A required `Select` blocks its `Form`'s submit and focus returns to the
 * **trigger**: React Aria submits the value through a visually hidden
 * `<select required>` and forwards its focus to the trigger button (read in
 * `HiddenSelect.mjs`). That hidden element is what `onInvalid` reports as its
 * target, so a `Select` is the one field whose event target is not the part
 * carrying `data-part="control"`.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Framework"
 *   placeholder="Choose a framework"
 *   description="Only the runtime changes; your data stays."
 *   isRequired
 * >
 *   <SelectItem id="react">React</SelectItem>
 *   <SelectItem id="vue">Vue</SelectItem>
 *   <SelectItem id="angular">Angular</SelectItem>
 * </Select>
 * ```
 */
export const Select = <T extends object = object>({
  label,
  description,
  errorMessage,
  placeholder = 'Select…',
  children,
  ...props
}: SelectProps<T>) => {
  const c = vars.colors.input.primary;

  return (
    <RACSelect
      {...props}
      data-scope="select"
      data-part="root"
      style={buildFieldRootStyle()}
    >
      {({ isInvalid, isRequired }) => {
        return (
          <>
            {/*
              The label reads the family's neutral ink. It alone used to tint
              itself `text.invalid` when the field was invalid — a divergence
              that stayed invisible because F-032 measured that token as the same
              ink as `text.default` in both modes. It is dropped rather than
              spread: when F-032 lands a real negative ink, a whole label turning
              red is not the language (the reference tints the message and the
              chrome, never the name of the field).
            */}
            {label != null && (
              <FieldLabelPart scope="select" colors={c} isRequired={isRequired}>
                {label}
              </FieldLabelPart>
            )}

            {/* trigger — the button that opens the dropdown */}
            <RACButton
              data-scope="select"
              data-part="trigger"
              style={({ isHovered, isDisabled, isFocusVisible }) => {
                return {
                  // The row, the floated focus ring and the declared reading
                  // edge all come from the shared anatomy. Before it, this
                  // trigger drew the ring flush at 0px where the rest of the
                  // family floats it at 2px, and its value inherited
                  // `text-align: center` from the `<button>` it is — so a
                  // selected value sat centred one row above a start-aligned
                  // input (visible in the Studio's invite dialog).
                  ...buildFieldControlStyle({
                    colors: c,
                    isHovered,
                    isDisabled,
                    isFocusVisible,
                    isInvalid,
                  }),
                  // What is the trigger's own: a row that pushes the chevron to
                  // the far edge, and the pointer affordance.
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: vars.spacing.gap.inline.sm,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? vars.opacity.disabled : undefined,
                } as React.CSSProperties;
              }}
            >
              {/* selected value or placeholder */}
              <SelectValue<T>
                data-scope="select"
                data-part="content"
                style={{ flex: 1 }}
              >
                {({
                  selectedText,
                  isPlaceholder,
                }: SelectValueRenderProps<T>) => {
                  return (
                    <span
                      style={{
                        color: isPlaceholder ? c?.text?.disabled : undefined,
                      }}
                    >
                      {isPlaceholder ? placeholder : selectedText}
                    </span>
                  );
                }}
              </SelectValue>

              {/* chevron icon */}
              <span
                data-scope="select"
                data-part="icon"
                aria-hidden
                style={ICON_SLOT_STYLE}
              >
                <Icon intent="disclosure.expand" size="text" />
              </span>
            </RACButton>

            {description != null && (
              <FieldDescriptionPart scope="select" colors={c}>
                {description}
              </FieldDescriptionPart>
            )}

            {/*
              Always mounted: with no `errorMessage` React Aria falls back to the
              platform's own constraint copy, which is the localized message we
              could not ship ourselves (ADR-001).
            */}
            <FieldValidationMessagePart scope="select" colors={c}>
              {errorMessage}
            </FieldValidationMessagePart>

            {/* dropdown popover */}
            <RACPopover
              data-scope="select"
              data-part="positioner"
              // Surface within the Select composite — uses Selection entity tokens.
              style={buildPopoverStyle(c)}
            >
              <RACListBox
                data-scope="select"
                data-part="surface"
                style={{
                  outline: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: vars.spacing.inset.control.md,
                  gap: vars.spacing.gap.stack.xs,
                }}
              >
                {children}
              </RACListBox>
            </RACPopover>
          </>
        );
      }}
    </RACSelect>
  );
};
Select.displayName = selectMeta.displayName;

// ---------------------------------------------------------------------------
// SelectItem — individual dropdown option
// ---------------------------------------------------------------------------

/**
 * Props for the SelectItem component.
 */
export type SelectItemProps = Omit<RACListBoxItemProps, 'style'>;

/**
 * A single option inside a `Select` dropdown.
 *
 * Renders interactive hover/focus/selected states via
 * `vars.colors.input.primary.*`.
 *
 * @example
 * ```tsx
 * <SelectItem id="react">React</SelectItem>
 * ```
 */
export const SelectItem = ({ children, ...props }: SelectItemProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACListBoxItem
      {...props}
      data-scope="select"
      data-part="item"
      style={({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
      }) => {
        return {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          paddingBlock: vars.spacing.inset.control.md,
          paddingInline: vars.spacing.inset.control.md,
          borderRadius: vars.radii.control,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          ...(vars.text.label.md as React.CSSProperties),
          backgroundColor: resolveInteractiveStyle(c?.background, {
            isDisabled,
            isSelected,
            isHovered,
            isPressed,
          }),
          color:
            resolveInteractiveStyle(c?.text, {
              isDisabled,
              isSelected,
              isHovered,
            }) ?? c?.text?.default,
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: FOCUS_RING_OFFSET,
          transitionProperty: 'background-color, color',
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
        } as React.CSSProperties;
      }}
    >
      {children}
    </RACListBoxItem>
  );
};
SelectItem.displayName = selectItemMeta.displayName;
