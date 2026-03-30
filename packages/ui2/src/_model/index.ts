/**
 * Component Model — Responsibility, Composition, and Token Resolution.
 *
 * This module defines the architectural vocabulary of @ttoss/ui2:
 *   - Responsibility: what the component IS
 *   - Composition (Host.Role): how an instance participates in composition
 *   - Token Resolution: which --tt-* tokens each context consumes
 *
 * Consumed by:
 *   - Component JSDoc (documents Responsibility)
 *   - Test registry (validates structural contracts)
 *   - AI/Copilot (understands which tokens to use for new components)
 *   - Applications (query token dependencies for overrides)
 */

// Composition model
export type {
  ActionSetRole,
  FieldFrameRole,
  Host,
  ItemFrameRole,
  RoleOf,
  SurfaceFrameRole,
} from './composition';
export { hostRoles } from './composition';

// Token resolution
export type {
  ColorPrefix,
  ElevationAlias,
  MotionPattern,
  RadiiAlias,
  SizingKey,
  SpacingPattern,
  TextStyleKey,
  TokenSpec,
  ZIndexAlias,
} from './tokenResolution';
export {
  colorVar,
  compositionTokens,
  elevationVar,
  motionVar,
  opacityVar,
  radiiVar,
  resolveTokens,
  responsibilityDefaults,
  sizingVar,
  spacingVar,
  textStyleVars,
  zIndexVar,
} from './tokenResolution';

/* ------------------------------------------------------------------ */
/*  Responsibility                                                     */
/* ------------------------------------------------------------------ */

/**
 * Each component has exactly one Responsibility — the UX intent it fulfills.
 *
 * - Action      → triggers commands (Button)
 * - Input       → direct user input (TextField, TextArea, SearchField)
 * - Selection   → choosing options (Checkbox, Switch, RadioGroup)
 * - Collection  → structured sets of items (Menu, List, Table)
 * - Overlay     → temporary layered UI (Dialog, Tooltip, Popover)
 * - Navigation  → movement across views (Tabs, Breadcrumb)
 * - Disclosure  → reveal/hide content in-place (Accordion, Collapsible)
 * - Feedback    → communicating state or outcome (Alert, Toast, Progress)
 * - Structure   → organizing interface structure (Field, Panel, Shell)
 */
export type Responsibility =
  | 'Action'
  | 'Input'
  | 'Selection'
  | 'Collection'
  | 'Overlay'
  | 'Navigation'
  | 'Disclosure'
  | 'Feedback'
  | 'Structure';

/* ------------------------------------------------------------------ */
/*  Behavioral class                                                   */
/* ------------------------------------------------------------------ */

/**
 * Behavioral class derived from Responsibility.
 *
 * Determines which universal CSS rules apply via the behavioral @layer:
 * - interactive:  disabled opacity + focus ring
 * - formControl:  interactive rules + input border semantics
 * - static:       no behavioral rules
 */
export type BehavioralClass = 'interactive' | 'formControl' | 'static';

export const BEHAVIORAL_CLASS: Record<Responsibility, BehavioralClass> = {
  Action: 'interactive',
  Input: 'formControl',
  Selection: 'formControl',
  Navigation: 'interactive',
  Disclosure: 'interactive',
  Collection: 'static',
  Overlay: 'interactive',
  Feedback: 'static',
  Structure: 'static',
};

export const resolveBehavioralClass = (r: Responsibility): BehavioralClass => {
  return BEHAVIORAL_CLASS[r];
};

/* ------------------------------------------------------------------ */
/*  Component kind                                                     */
/* ------------------------------------------------------------------ */

/**
 * Whether a component lives in `components/` or `composites/`.
 *
 * - component  → single-concept primitive, simple API (e.g. Button, Checkbox)
 * - composite  → multi-part compound with `Component.Part` namespace (e.g. Dialog, Tabs)
 */
export type ComponentKind = 'component' | 'composite';

/* ------------------------------------------------------------------ */
/*  Token namespace                                                    */
/* ------------------------------------------------------------------ */

/**
 * Semantic token namespace consumed by a component.
 * Maps to CSS custom properties: `--tt-{namespace}-{role}-{dimension}-{state}`
 *
 * @example
 * 'action'   → --tt-action-primary-background-default
 * 'input'    → --tt-input-primary-border-default
 * 'content'  → --tt-content-primary-text-default
 * 'feedback' → --tt-feedback-negative-text-default
 */
export type TokenNamespace =
  | 'action'
  | 'input'
  | 'content'
  | 'feedback'
  | 'navigation'
  | 'elevation'
  | 'spacing'
  | 'radii'
  | 'color';

/* ------------------------------------------------------------------ */
/*  Component contract                                                 */
/* ------------------------------------------------------------------ */

import type { Host } from './composition';

/**
 * Describes the architectural contract of a ui2 component.
 * Machine-readable documentation consumed by tests, AI, and tooling.
 */
export interface ComponentContract {
  /** Component export name (e.g. "Button", "Dialog") */
  name: string;
  /** Whether it's a primitive component or a multi-part composite */
  kind: ComponentKind;
  /** UX responsibility */
  responsibility: Responsibility;
  /** BEM block slug used in CSS classes (e.g. "button" → .ui2-button) */
  cssSlug: string;
  /** Token namespaces consumed by this component */
  tokens: TokenNamespace[];
  /** Ark UI primitive used (if any) */
  arkPrimitive?: string;
  /** Host this composite manages (composites only) */
  host?: Host;
}

/* ------------------------------------------------------------------ */
/*  Contract registry                                                  */
/* ------------------------------------------------------------------ */

/**
 * All component contracts — single source of truth for the Component Model.
 */
export const componentContracts: ComponentContract[] = [
  {
    name: 'Button',
    kind: 'component',
    responsibility: 'Action',
    cssSlug: 'button',
    tokens: ['action', 'radii', 'spacing'],
  },
  {
    name: 'Checkbox',
    kind: 'component',
    responsibility: 'Selection',
    cssSlug: 'checkbox',
    tokens: ['action', 'content', 'input', 'radii', 'spacing'],
    arkPrimitive: 'checkbox',
  },
  {
    name: 'Switch',
    kind: 'component',
    responsibility: 'Selection',
    cssSlug: 'switch',
    tokens: ['action', 'content', 'elevation', 'input', 'radii', 'spacing'],
    arkPrimitive: 'switch',
  },
  {
    name: 'Tooltip',
    kind: 'component',
    responsibility: 'Overlay',
    cssSlug: 'tooltip',
    tokens: ['content', 'elevation', 'radii', 'spacing'],
    arkPrimitive: 'tooltip',
  },
  {
    name: 'Dialog',
    kind: 'composite',
    responsibility: 'Overlay',
    cssSlug: 'dialog',
    tokens: ['action', 'content', 'elevation', 'radii', 'spacing'],
    arkPrimitive: 'dialog',
    host: 'SurfaceFrame',
  },
  {
    name: 'Tabs',
    kind: 'composite',
    responsibility: 'Navigation',
    cssSlug: 'tabs',
    tokens: ['navigation', 'spacing'],
    arkPrimitive: 'tabs',
  },
  {
    name: 'Accordion',
    kind: 'composite',
    responsibility: 'Disclosure',
    cssSlug: 'accordion',
    tokens: ['action', 'content', 'spacing'],
    arkPrimitive: 'accordion',
  },
  {
    name: 'Field',
    kind: 'composite',
    responsibility: 'Structure',
    cssSlug: 'field',
    tokens: ['action', 'content', 'feedback', 'input', 'radii', 'spacing'],
    arkPrimitive: 'field',
    host: 'FieldFrame',
  },
];
