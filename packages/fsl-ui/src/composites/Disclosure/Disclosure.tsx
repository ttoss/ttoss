import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
  type DisclosurePanelProps as RACDisclosurePanelProps,
  type DisclosureProps as RACDisclosureProps,
  DisclosureStateContext,
  Heading as RACHeading,
} from 'react-aria-components';

import { Icon } from '../../components/Icon';
import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — host-presence guard + evaluation propagation.
//
// `Disclosure` is the host and seeds `evaluation`. `DisclosureTrigger` and
// `DisclosurePanel` consume the same value (coherent chrome) AND assert host
// presence — rendered standalone they throw with a clear message.
// ---------------------------------------------------------------------------

type DisclosureEvaluation = EvaluationsFor<'Disclosure'>;

const disclosureScope = createCompositeScope<{
  evaluation: DisclosureEvaluation;
}>('Disclosure');

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Disclosure → CONTRACT.md §1 row:
//   colors: `navigation.{primary|muted}` (uxContext = navigation),
//   radii: `control` (trigger) / `surface` (panel), border: `outline.control`,
//   sizing: `hit`, spacing: `inset.control`, typography: `label.md`,
//   elevation: `flat`, motion: `transition.{enter,exit}` (disclosure chrome
//   animates the panel affordance, not micro-feedback on a control).
//
// `Disclosure` is the standalone counterpart of `Accordion` (which is a
// DisclosureGroup). It is one collapsible section — a header (heading +
// trigger button) plus a panel — with no sibling coordination. The
// `expanded` token State is driven by React Aria's `isExpanded`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Disclosure root (Disclosure entity, single section). */
export const disclosureMeta = {
  displayName: 'Disclosure',
  entity: 'Disclosure',
  structure: 'root',
} as const satisfies ComponentMeta<'Disclosure'>;

/** Formal semantic identity — DisclosureTrigger (header button). */
export const disclosureTriggerMeta = {
  displayName: 'DisclosureTrigger',
  entity: 'Disclosure',
  structure: 'trigger',
} as const satisfies ComponentMeta<'Disclosure'>;

/** Formal semantic identity — DisclosurePanel (collapsible content region). */
export const disclosurePanelMeta = {
  displayName: 'DisclosurePanel',
  entity: 'Disclosure',
  structure: 'content',
} as const satisfies ComponentMeta<'Disclosure'>;

// ---------------------------------------------------------------------------
// Disclosure — root
// ---------------------------------------------------------------------------

/**
 * Props for the Disclosure component.
 *
 * The composite owns its layout; pass `style`/`className` on a wrapping
 * element rather than on the composite root. See CONTRIBUTING §4.
 */
export interface DisclosureProps extends Omit<
  RACDisclosureProps,
  'style' | 'children' | 'className'
> {
  /**
   * Authorial emphasis. `primary` is the standard disclosure chrome; `muted`
   * is a subdued variant for sidebars and dense lists.
   * @default 'primary'
   */
  evaluation?: DisclosureEvaluation;
  /** `DisclosureTrigger` then `DisclosurePanel`, in that order. */
  children?: React.ReactNode;
}

/**
 * A single collapsible section built on React Aria's `Disclosure`.
 *
 * The standalone counterpart of `Accordion` (a `DisclosureGroup`): use
 * `Disclosure` when there is exactly one expandable region with no sibling
 * coordination (a "show more" block, an optional settings section). Entity =
 * Disclosure → reads `vars.colors.navigation.{primary|muted}` and animates
 * with `vars.motion.transition.{enter,exit}`.
 *
 * @example
 * ```tsx
 * <Disclosure>
 *   <DisclosureTrigger>Advanced options</DisclosureTrigger>
 *   <DisclosurePanel>Rarely-needed settings live here.</DisclosurePanel>
 * </Disclosure>
 * ```
 */
export const Disclosure = ({
  evaluation = 'primary',
  children,
  ...props
}: DisclosureProps) => {
  return (
    <disclosureScope.Provider value={{ evaluation }}>
      <RACDisclosure
        {...props}
        data-scope="disclosure"
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
      </RACDisclosure>
    </disclosureScope.Provider>
  );
};
Disclosure.displayName = disclosureMeta.displayName;

// ---------------------------------------------------------------------------
// DisclosureTrigger — header button that toggles the panel
// ---------------------------------------------------------------------------

/**
 * Props for the DisclosureTrigger component.
 *
 * Extends the React Aria `Button` API (minus `style`/`className`/`slot`) so
 * behavior props — `isDisabled`, `onPress`, `id`, `aria-*` — flow through.
 */
export interface DisclosureTriggerProps extends Omit<
  RACButtonProps,
  'style' | 'className' | 'children' | 'slot'
> {
  /**
   * HTML heading level of the wrapping heading element. Pick the level that
   * fits the host page's document outline.
   * @default 3
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Visible label content of the trigger row. */
  children?: React.ReactNode;
}

/**
 * The clickable header of a `Disclosure`. Renders inside a heading element
 * (level via `headingLevel`, default `<h3>`) and exposes `aria-expanded` plus
 * a chevron that rotates when the section is open. Must be used inside a
 * `Disclosure`.
 */
export const DisclosureTrigger = ({
  headingLevel = 3,
  children,
  ...props
}: DisclosureTriggerProps) => {
  const { evaluation } = disclosureScope.use(disclosureTriggerMeta.displayName);
  const c = vars.colors.navigation[evaluation];
  const disclosureState = React.useContext(DisclosureStateContext);
  const isExpanded = disclosureState?.isExpanded ?? false;

  return (
    <RACHeading
      level={headingLevel}
      data-scope="disclosure"
      data-part="header"
      style={{ margin: 0 }}
    >
      <RACButton
        {...props}
        slot="trigger"
        data-scope="disclosure"
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
            minHeight: vars.sizing.hit,
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
            transitionProperty: 'background-color, color',
            transitionDuration: vars.motion.transition.enter.duration,
            transitionTimingFunction: vars.motion.transition.enter.easing,
            outline: focusRingOutline(isFocusVisible),
            outlineOffset: '-2px',
          } as React.CSSProperties;
        }}
      >
        <span data-scope="disclosure" data-part="label" style={{ flex: 1 }}>
          {children}
        </span>

        {/* chevron — rotates 90° when the section is expanded. */}
        <span
          data-scope="disclosure"
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
          <Icon intent="disclosure.collapse" />
        </span>
      </RACButton>
    </RACHeading>
  );
};
DisclosureTrigger.displayName = disclosureTriggerMeta.displayName;

// ---------------------------------------------------------------------------
// DisclosurePanel — collapsible content region
// ---------------------------------------------------------------------------

/** Props for the DisclosurePanel component. */
export type DisclosurePanelProps = Omit<
  RACDisclosurePanelProps,
  'style' | 'className'
>;

/**
 * The collapsible content region of a `Disclosure`. React Aria handles
 * show/hide via the parent Disclosure state; the chrome uses
 * `vars.motion.transition.{enter,exit}` semantics. Must be used inside a
 * `Disclosure`.
 *
 * @example
 * ```tsx
 * <DisclosurePanel>Rarely-needed settings live here.</DisclosurePanel>
 * ```
 */
export const DisclosurePanel = ({
  children,
  ...props
}: DisclosurePanelProps) => {
  const { evaluation } = disclosureScope.use(disclosurePanelMeta.displayName);
  const c = vars.colors.navigation[evaluation];

  // React Aria collapses the panel with `hidden="until-found"`, which sets
  // `content-visibility: hidden`: the panel's *contents* are skipped but the
  // element's own box (padding included) still lays out. Padding therefore
  // lives on an inner wrapper — skipped along with the content when collapsed —
  // so a collapsed panel occupies zero height instead of leaking its inset.
  return (
    <RACDisclosurePanel
      {...props}
      data-scope="disclosure"
      data-part="content"
      style={{ boxSizing: 'border-box' } as React.CSSProperties}
    >
      <div
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
      </div>
    </RACDisclosurePanel>
  );
};
DisclosurePanel.displayName = disclosurePanelMeta.displayName;
