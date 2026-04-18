import { vars } from '@ttoss/theme2/vars';
import * as React from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosureGroup as RACDisclosureGroup,
  type DisclosureGroupProps as RACDisclosureGroupProps,
  DisclosurePanel as RACDisclosurePanel,
  type DisclosurePanelProps as RACDisclosurePanelProps,
  type DisclosureProps as RACDisclosureProps,
  DisclosureStateContext,
  Heading as RACHeading,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Evaluation propagation
//
// Accordion is a composite: the evaluation set on the group propagates to
// every AccordionItem child via React Context — same pattern used by
// RadioGroup before the Selection refactor. The evaluation determines which
// `vars.colors.navigation.{primary|muted}` subtree is consumed.
// ---------------------------------------------------------------------------

type AccordionEvaluation = EvaluationsFor<'Disclosure'>;
const AccordionEvaluationContext = React.createContext<
  AccordionEvaluation | undefined
>(undefined);

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Disclosure → CONTRACT.md §1 row:
//   colors: `navigation.{primary|muted}` (uxContext = navigation),
//   radii: `control` (trigger button), `surface` (panel container),
//   border: `outline.control` (trigger), `divider` (between items),
//   sizing: `hit.base`, spacing: `inset.control`,
//   typography: `label.md`, elevation: `flat`,
//   motion: `transition.{enter,exit}` (NOT `feedback` — disclosure animates
//   container affordances, not micro-feedback on a control).
//
// State surface for `disclose.toggle`: default · hover · focused · disabled ·
// expanded (taxonomy.ts INTERACTION_STATE). The `expanded` State is driven
// by React Aria's `isExpanded` render-prop and surfaces via the canonical
// `expanded` token state on `vars.colors.navigation.{role}.{dimension}`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Accordion root (Disclosure entity, group host). */
export const accordionMeta = {
  displayName: 'Accordion',
  entity: 'Disclosure',
  structure: 'root',
  interaction: 'disclose.toggle',
} as const satisfies ComponentMeta<'Disclosure'>;

/** Formal semantic identity — AccordionItem (Disclosure entity, single item). */
export const accordionItemMeta = {
  displayName: 'AccordionItem',
  entity: 'Disclosure',
  structure: 'root',
  composition: 'control',
  interaction: 'disclose.toggle',
} as const satisfies ComponentMeta<'Disclosure'>;

/** Formal semantic identity — AccordionTrigger (header button). */
export const accordionTriggerMeta = {
  displayName: 'AccordionTrigger',
  entity: 'Disclosure',
  structure: 'trigger',
  interaction: 'disclose.toggle',
} as const satisfies ComponentMeta<'Disclosure'>;

/** Formal semantic identity — AccordionPanel (collapsible content region). */
export const accordionPanelMeta = {
  displayName: 'AccordionPanel',
  entity: 'Disclosure',
  structure: 'content',
} as const satisfies ComponentMeta<'Disclosure'>;

// Visual-only chevron — purely decorative, no i18n.
const CHEVRON = String.fromCharCode(0x25b8); // ▸ — rotates 90° when expanded

// ---------------------------------------------------------------------------
// Accordion — group orchestrator
// ---------------------------------------------------------------------------

/**
 * Props for the Accordion component.
 */
export interface AccordionProps extends Omit<
  RACDisclosureGroupProps,
  'style' | 'children' | 'className'
> {
  /**
   * Authorial emphasis. `primary` is the standard accordion chrome;
   * `muted` is a subdued variant for sidebars and dense lists.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<'Disclosure'>;
  /** `AccordionItem` children. */
  children?: React.ReactNode;
}

/**
 * A semantic accordion built on React Aria's `DisclosureGroup`.
 *
 * Entity = Disclosure, interaction = `disclose.toggle`. Reads from
 * `vars.colors.navigation.{primary|muted}` and animates with
 * `vars.motion.transition.{enter,exit}` — never with `vars.motion.feedback`,
 * which is reserved for micro-interactions on Action and Input controls.
 *
 * Supports single-expand (default) or `allowsMultipleExpanded` for multiple
 * concurrently open panels.
 *
 * @example
 * ```tsx
 * <Accordion>
 *   <AccordionItem id="terms">
 *     <AccordionTrigger>Terms of service</AccordionTrigger>
 *     <AccordionPanel>You agree not to misuse the service.</AccordionPanel>
 *   </AccordionItem>
 *   <AccordionItem id="privacy">
 *     <AccordionTrigger>Privacy policy</AccordionTrigger>
 *     <AccordionPanel>We collect minimal personal data.</AccordionPanel>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion = ({
  evaluation = 'primary',
  children,
  ...props
}: AccordionProps) => {
  return (
    <AccordionEvaluationContext.Provider value={evaluation}>
      <RACDisclosureGroup
        {...props}
        data-scope="accordion"
        data-part="root"
        data-evaluation={evaluation}
        style={
          {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            borderWidth: vars.border.outline.control.width,
            borderStyle: vars.border.outline.control.style,
            borderColor:
              vars.colors.navigation[evaluation]?.border?.default ??
              'transparent',
            borderRadius: vars.radii.surface,
            overflow: 'hidden',
          } as React.CSSProperties
        }
      >
        {children}
      </RACDisclosureGroup>
    </AccordionEvaluationContext.Provider>
  );
};
Accordion.displayName = accordionMeta.displayName;

// ---------------------------------------------------------------------------
// AccordionItem — single Disclosure container
// ---------------------------------------------------------------------------

/**
 * Props for the AccordionItem component.
 */
export interface AccordionItemProps extends Omit<
  RACDisclosureProps,
  'style' | 'children' | 'className'
> {
  /** `AccordionTrigger` and `AccordionPanel` children, in that order. */
  children?: React.ReactNode;
}

/**
 * A single collapsible item — must be used inside an `Accordion`.
 *
 * Wraps React Aria's `Disclosure`. Adjacent items are separated by a divider
 * border; the last item's bottom border is suppressed by the parent `overflow:
 * hidden` + the rounded surface radius.
 *
 * @example
 * ```tsx
 * <AccordionItem id="terms">
 *   <AccordionTrigger>Terms of service</AccordionTrigger>
 *   <AccordionPanel>You agree not to misuse the service.</AccordionPanel>
 * </AccordionItem>
 * ```
 */
export const AccordionItem = ({ children, ...props }: AccordionItemProps) => {
  const evaluation = React.useContext(AccordionEvaluationContext) ?? 'primary';

  return (
    <RACDisclosure
      {...props}
      data-scope="accordion"
      data-part="item"
      style={
        {
          boxSizing: 'border-box',
          // Divider between siblings — collapses on the first item via
          // sibling selectors when consumers compose without the group, and
          // is naturally clipped at the group bottom by `overflow: hidden`.
          borderBlockStartWidth: vars.border.divider.width,
          borderBlockStartStyle: vars.border.divider.style,
          borderBlockStartColor:
            vars.colors.navigation[evaluation]?.border?.default ??
            'transparent',
        } as React.CSSProperties
      }
    >
      {children}
    </RACDisclosure>
  );
};
AccordionItem.displayName = accordionItemMeta.displayName;

// ---------------------------------------------------------------------------
// AccordionTrigger — header button that toggles the panel
// ---------------------------------------------------------------------------

/**
 * Props for the AccordionTrigger component.
 */
export interface AccordionTriggerProps {
  /** Visible label content of the trigger row. */
  children?: React.ReactNode;
}

/**
 * The clickable header of an `AccordionItem`. Renders inside an `<h3>`
 * (per RAC's recommended structure) and exposes `aria-expanded` / a
 * controlled chevron icon.
 *
 * Reads `isExpanded`, `isHovered`, `isFocusVisible`, `isDisabled` from RAC's
 * `Button` render-props and resolves them through the canonical state
 * cascade in [`resolveInteractiveStyle`](../../tokens/resolveInteractiveStyle.ts).
 */
export const AccordionTrigger = ({ children }: AccordionTriggerProps) => {
  const evaluation = React.useContext(AccordionEvaluationContext) ?? 'primary';
  const c = vars.colors.navigation[evaluation];
  // RAC propagates the live Disclosure state to descendants via this context.
  // We read `isExpanded` here to fold it into the canonical state cascade
  // (so the trigger reflects `expanded` colors) and to drive the chevron
  // rotation via inline style.
  const disclosureState = React.useContext(DisclosureStateContext);
  const isExpanded = disclosureState?.isExpanded ?? false;

  return (
    <RACHeading
      level={3}
      data-scope="accordion"
      data-part="header"
      style={{ margin: 0 }}
    >
      <RACButton
        slot="trigger"
        data-scope="accordion"
        data-part="trigger"
        style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
          const flags = {
            isHovered,
            isPressed,
            isDisabled,
            isFocusVisible,
            isExpanded,
          } as const;

          return {
            boxSizing: 'border-box',
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: vars.spacing.gap.inline.sm,
            minHeight: vars.sizing.hit.base,
            paddingBlock: vars.spacing.inset.control.md,
            paddingInline: vars.spacing.inset.control.md,
            border: 'none',
            background: 'none',
            backgroundColor: resolveInteractiveStyle(c?.background, flags),
            color: resolveInteractiveStyle(c?.text, flags) ?? c?.text?.default,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? vars.opacity.disabled : undefined,
            ...(vars.text.label.md as React.CSSProperties),
            textAlign: 'start',
            // Disclosure chrome animates with `transition`, not `feedback` —
            // the affordance is the whole panel opening, not a micro-state
            // change on the trigger itself.
            transitionProperty: 'background-color, color',
            transitionDuration: vars.motion.transition.enter.duration,
            transitionTimingFunction: vars.motion.transition.enter.easing,
            outline: isFocusVisible
              ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
              : 'none',
            outlineOffset: '-2px',
          } as React.CSSProperties;
        }}
      >
        {/* label */}
        <span data-scope="accordion" data-part="label" style={{ flex: 1 }}>
          {children}
        </span>

        {/* chevron — rotates 90° when the parent disclosure is expanded. */}
        <span
          data-scope="accordion"
          data-part="indicator"
          aria-hidden
          style={
            {
              flexShrink: 0,
              display: 'inline-block',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transitionProperty: 'transform',
              transitionDuration: isExpanded
                ? vars.motion.transition.enter.duration
                : vars.motion.transition.exit.duration,
              transitionTimingFunction: isExpanded
                ? vars.motion.transition.enter.easing
                : vars.motion.transition.exit.easing,
            } as React.CSSProperties
          }
        >
          {CHEVRON}
        </span>
      </RACButton>
    </RACHeading>
  );
};
AccordionTrigger.displayName = accordionTriggerMeta.displayName;

// ---------------------------------------------------------------------------
// AccordionPanel — collapsible content region
// ---------------------------------------------------------------------------

/**
 * Props for the AccordionPanel component.
 */
export type AccordionPanelProps = Omit<
  RACDisclosurePanelProps,
  'style' | 'className'
>;

/**
 * The collapsible content region of an `AccordionItem`. RAC handles the
 * show/hide via the parent Disclosure state; we apply the
 * `vars.motion.transition.{enter,exit}` semantics for the chrome's
 * appearance change.
 *
 * @example
 * ```tsx
 * <AccordionPanel>You agree not to misuse the service.</AccordionPanel>
 * ```
 */
export const AccordionPanel = ({ children, ...props }: AccordionPanelProps) => {
  const evaluation = React.useContext(AccordionEvaluationContext) ?? 'primary';
  const c = vars.colors.navigation[evaluation];

  return (
    <RACDisclosurePanel
      {...props}
      data-scope="accordion"
      data-part="content"
      style={
        {
          boxSizing: 'border-box',
          paddingBlock: vars.spacing.inset.control.md,
          paddingInline: vars.spacing.inset.control.md,
          backgroundColor: c?.background?.default,
          color: c?.text?.default,
          ...(vars.text.body.md as React.CSSProperties),
        } as React.CSSProperties
      }
    >
      {children}
    </RACDisclosurePanel>
  );
};
AccordionPanel.displayName = accordionPanelMeta.displayName;
