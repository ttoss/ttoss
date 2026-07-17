import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  Label as RACLabel,
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
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control` + `selected`,
//   sizing: `hit.base`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback is driven by React Aria's `isInvalid` (or `validate`
// callback) and surfaces via the `invalid` token State on the trigger.
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

/** Trigger label color — invalid dominates default (Selection has no evaluation). */
const resolveSelectLabelColor = ({
  c,
  isInvalid,
}: {
  c: InputColors;
  isInvalid?: boolean;
}): string | undefined => {
  const text = c?.text ?? {};
  return isInvalid ? text.invalid : text.default;
};

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
 * `invalid` token State.
 *
 * @example
 * ```tsx
 * <Select label="Framework" placeholder="Choose a framework">
 *   <SelectItem id="react">React</SelectItem>
 *   <SelectItem id="vue">Vue</SelectItem>
 *   <SelectItem id="angular">Angular</SelectItem>
 * </Select>
 * ```
 */
export const Select = <T extends object = object>({
  label,
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
      style={{
        boxSizing: 'border-box',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
      }}
    >
      {({ isInvalid }) => {
        return (
          <>
            {/* label */}
            {label && (
              <RACLabel
                data-scope="select"
                data-part="label"
                style={{
                  ...(vars.text.label.md as React.CSSProperties),
                  color: resolveSelectLabelColor({ c, isInvalid }),
                }}
              >
                {label}
              </RACLabel>
            )}

            {/* trigger — the button that opens the dropdown */}
            <RACButton
              data-scope="select"
              data-part="trigger"
              style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
                return {
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: vars.spacing.gap.inline.sm,
                  minHeight: vars.sizing.hit.base,
                  paddingBlock: vars.spacing.inset.control.md,
                  paddingInline: vars.spacing.inset.control.md,
                  borderRadius: vars.radii.control,
                  borderWidth: vars.border.outline.control.width,
                  borderStyle: vars.border.outline.control.style,
                  ...(vars.text.label.md as React.CSSProperties),
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? vars.opacity.disabled : undefined,
                  backgroundColor: resolveInteractiveStyle(c?.background, {
                    isDisabled,
                    isInvalid,
                    isHovered,
                    isPressed,
                  }),
                  borderColor: resolveInteractiveStyle(c?.border, {
                    isDisabled,
                    isInvalid,
                    isFocusVisible,
                  }),
                  color:
                    resolveInteractiveStyle(c?.text, {
                      isDisabled,
                      isInvalid,
                      isHovered,
                      isPressed,
                    }) ?? c?.text?.default,
                  transitionProperty: 'background-color, border-color, color',
                  transitionDuration: vars.motion.feedback.duration,
                  transitionTimingFunction: vars.motion.feedback.easing,
                  outline: focusRingOutline(isFocusVisible),
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
                style={{ flexShrink: 0 }}
              >
                <Icon intent="disclosure.expand" />
              </span>
            </RACButton>

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
          outlineOffset: '2px',
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
