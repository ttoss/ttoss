import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  ComboBox as RACComboBox,
  type ComboBoxProps as RACComboBoxProps,
  Group as RACGroup,
  Input as RACInput,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  Popover as RACPopover,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { buildChoosableRowStyle } from '../../tokens/choosableRow';
import { buildEmbeddedTriggerStyle } from '../../tokens/embeddedTrigger';
import { fslVar } from '../../tokens/escapeHatch';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  buildFieldFrameStyle,
  buildFieldRootStyle,
  buildFieldValueStyle,
  buildPickerListStyle,
  buildPickerPopoverStyle,
  FieldDescriptionPart,
  FieldInvalidGlyph,
  FieldLabelPart,
  FieldValidationMessagePart,
  useFieldLayout,
} from '../Field/anatomy';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`, sizing: `hit`,
//   spacing: `inset.control`, typography: `label.md`, motion: `feedback`,
//   elevation: `flat`.
//
// ENTITY RATIONALE (the ROADMAP flagged ComboBox as "the accordion-vs-select
// of ambiguity cases" and asked for this to be recorded here). A ComboBox is
// `Input`, not `Selection`, because the user's primary act is **typing** — the
// text field is the control, and the filtered list is an affordance that
// narrows what they type. `Select` is `Selection` because its only act is
// picking from a closed set: there is no freeform channel at all. The
// discriminant is the same one CONTRACT.md §1.1 uses for the cognitive mode —
// both are "Providing", but Selection is *constrained* provision while a
// ComboBox restores the freeform channel (and, with `allowsCustomValue`, can
// accept a value that is not in the set — something no Selection can do).
// Both Entities project to the `input` ux context, so the per-part split below
// reads one coherent set of color tokens.
//
// PER-PART ENTITY SPLIT (ADR-007). The options are `Selection`/`item` — the
// same identity `SelectItem`/`ListBoxItem` carry, because option-selection
// semantics are identical wherever the popover is hosted. The entity→ux
// contract test unions the contexts of every entity declared in a file, and
// Input and Selection both map to `input`, so the reads stay legal.
//
// FRICTION LOG (FSL validation). The ROADMAP's anatomy lists `trigger` and
// `item` as ComboBox parts with "taxonomy additions needed: none". Only the
// second half holds: `trigger` is not a legal `Input` structural role (only
// Disclosure has it). Resolved exactly as NumberField resolved its steppers
// and Slider resolved its track (ADR-008): the chevron button ships as an
// INTERNAL data-part carrying no `*Meta`, so no illegal role is ever claimed
// and no widening is proposed. `item` needed no workaround at all — it is
// legal on Selection, which is the entity the options already wanted.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ComboBox root (Input entity). */
export const comboBoxMeta = {
  displayName: 'ComboBox',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — a single filtered option (Selection entity). */
export const comboBoxItemMeta = {
  displayName: 'ComboBoxItem',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

/**
 * Scroll cap for the options popover. A ComboBox exists because the option set
 * is too long to scan (friction F-008: 30+ timezones), so the list must scroll
 * inside a bounded viewport instead of running off-screen. `20rem` keeps ~8
 * options visible at the standard hit size; the `60vh` term keeps it inside
 * short viewports. Host-overridable per CONTRACT.md §7.
 */
const LIST_MAX_HEIGHT = 'min(20rem, 60vh)';

/** Props for the ComboBox component. */
export interface ComboBoxProps<T extends object = object> extends Omit<
  RACComboBoxProps<T>,
  'style' | 'children' | 'className'
> {
  /** Visible label displayed above the field. */
  label?: React.ReactNode;
  /**
   * A `<ContextualHelp>` element rendered beside the label (the reference
   * system's prop shape) — for the explanation too long for `description`.
   */
  contextualHelp?: React.ReactNode;
  /** Supplementary helper text linked to the field via `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Validation message shown when the field is invalid. Supply
   * caller-localized copy (i18n rule / §6).
   */
  errorMessage?: React.ReactNode;
  /**
   * Placeholder shown in the text input while it is empty.
   *
   * Ships a documented English fallback — the placeholder is supplementary
   * hint text, not a flow-critical label (CONTRIBUTING §6.2 / ADR-001).
   * Localized hosts should still supply their own copy.
   * @default 'Search…'
   */
  placeholder?: string;
  /**
   * Accessible name for the chevron button that opens the full list (the icon
   * is the sole carrier of meaning). Documented English fallback, overridable
   * (i18n rule §6.2).
   * @default 'Show suggestions'
   */
  triggerLabel?: string;
  /** `ComboBoxItem` children rendered inside the filtered options list. */
  children?: React.ReactNode;
}

/**
 * A semantic text input with a filtered option list, built on React Aria.
 *
 * The answer to a `Select` that has grown past scanning range: typing filters
 * the options (typeahead), while the chevron still opens the full list. Entity
 * = Input — the user's primary act is typing, and the list narrows what they
 * type (see the Entity rationale in this file's header). Options are
 * `ComboBoxItem`.
 *
 * Validation is the `invalid` State (via `isInvalid`/`validate`), never an
 * `evaluation` variant, and it surfaces in a `validationMessage` part — which
 * `Select` now carries too (F-009 closed in forms C2; this doc claimed the
 * distinction while it lasted).
 *
 * Host geometry knob: `--fsl-combo-box-max-height` caps the scrolling list.
 *
 * @example
 * ```tsx
 * <ComboBox label="Timezone" defaultSelectedKey="America/Sao_Paulo">
 *   <ComboBoxItem id="America/Sao_Paulo">São Paulo</ComboBoxItem>
 *   <ComboBoxItem id="Europe/Lisbon">Lisbon</ComboBoxItem>
 * </ComboBox>
 * ```
 */
export const ComboBox = <T extends object = object>({
  label,
  contextualHelp,
  description,
  errorMessage,
  placeholder = 'Search…',
  triggerLabel = 'Show suggestions',
  children,
  ...props
}: ComboBoxProps<T>) => {
  const c = vars.colors.input.primary;
  const { labelPosition } = useFieldLayout();

  return (
    <RACComboBox
      {...props}
      data-scope="combo-box"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      {label != null && (
        <FieldLabelPart
          scope="combo-box"
          contextualHelp={contextualHelp}
          colors={c}
          isRequired={props.isRequired}
        >
          {label}
        </FieldLabelPart>
      )}

      {/*
        The frame paints and hosts the trigger; `control` stays on the `<input>`
        the user operates, so `[data-part="control"]` resolves something you can
        type into (ADR-022, invariant #12).
      */}
      <RACGroup
        data-scope="combo-box"
        data-part="frame"
        style={({ isDisabled, isInvalid, isFocusVisible }) => {
          return buildFieldFrameStyle({
            colors: c,
            labelPosition,
            isDisabled,
            isInvalid,
            isFocusVisible,
          });
        }}
      >
        {({ isInvalid }) => {
          return (
            <>
              <RACInput
                data-scope="combo-box"
                data-part="control"
                placeholder={placeholder}
                style={({ isHovered, isDisabled, isInvalid }) => {
                  return buildFieldValueStyle({
                    colors: c,
                    isHovered,
                    isDisabled,
                    isInvalid,
                  });
                }}
              />

              <FieldInvalidGlyph scope="combo-box" isInvalid={isInvalid} />

              <RACButton
                aria-label={triggerLabel}
                data-scope="combo-box"
                data-part="trigger"
                style={({ isHovered, isDisabled, isFocusVisible }) => {
                  return buildEmbeddedTriggerStyle({
                    colors: c,
                    isHovered,
                    isDisabled,
                    isFocusVisible,
                  });
                }}
              >
                {/*
            Decorative — the button owns the accessible name (CONTRACT §9.4).
            `size="sm"` and not `size="text"`: a font-relative glyph inside a
            `<button>` that declares no type of its own resolves against the UA's
            13.3333px, which is what made this chevron 25.33px in a family whose
            other triggers were 32 and 20 (see EMBEDDED_TRIGGER).
          */}
                <Icon intent="disclosure.expand" size="sm" />
              </RACButton>
            </>
          );
        }}
      </RACGroup>

      {description != null && (
        <FieldDescriptionPart scope="combo-box" colors={c}>
          {description}
        </FieldDescriptionPart>
      )}

      <FieldValidationMessagePart scope="combo-box" colors={c}>
        {errorMessage}
      </FieldValidationMessagePart>

      {/*
        Same row-width rule as `Select` (F-019, ADR-023): measured 142.88px under
        a 1200px frame before it read `--trigger-width`.
      */}
      <RACPopover
        data-scope="combo-box"
        data-part="positioner"
        style={buildPickerPopoverStyle({
          colors: c,
          widthKnob: '--fsl-combo-box-popover-width',
        })}
      >
        <RACListBox
          data-scope="combo-box"
          data-part="surface"
          style={buildPickerListStyle({
            maxHeight: fslVar('--fsl-combo-box-max-height', LIST_MAX_HEIGHT),
          })}
        >
          {children}
        </RACListBox>
      </RACPopover>
    </RACComboBox>
  );
};
ComboBox.displayName = comboBoxMeta.displayName;

/** Props for the ComboBoxItem component. */
export type ComboBoxItemProps = Omit<RACListBoxItemProps, 'style'>;

/**
 * A single option inside a `ComboBox` list.
 *
 * Renders interactive hover/focus/selected states via
 * `vars.colors.input.primary.*` — the same selection chrome `SelectItem` and
 * `ListBoxItem` carry (ADR-007).
 *
 * @example
 * ```tsx
 * <ComboBoxItem id="Europe/Lisbon">Lisbon</ComboBoxItem>
 * ```
 */
export const ComboBoxItem = ({ children, ...props }: ComboBoxItemProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACListBoxItem
      {...props}
      data-scope="combo-box"
      data-part="item"
      style={({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
      }) => {
        return {
          ...buildChoosableRowStyle(),
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
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
ComboBoxItem.displayName = comboBoxItemMeta.displayName;
