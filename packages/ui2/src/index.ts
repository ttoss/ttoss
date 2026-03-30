/**
 * @ttoss/ui2 — Semantic, token-native component library for ttoss.
 *
 * Built on Ark UI primitives. Consumes @ttoss/theme2 semantic tokens via CSS custom properties.
 *
 * Architecture:
 *   components/   — Single-concept primitives (simple API, no namespace sub-parts)
 *   composites/   — Multi-part compound components (Component.Root/Part API)
 *   _shared/      — Internal utilities (cn, icons)
 *   _model/       — Component Model contracts & conventions
 *
 * Components are organized by Responsibility:
 * - Action: Button
 * - Selection: Checkbox, Switch
 * - Overlay: Dialog, Tooltip
 * - Navigation: Tabs
 * - Disclosure: Accordion
 * - Structure (FieldFrame): Field
 *
 * Usage:
 * 1. Generate CSS vars from a theme: `toCssVars(theme).toCssString()`
 * 2. Include the generated CSS and `@ttoss/ui2/styles.css` in your app.
 * 3. Use components directly.
 */

// Action
export type { ButtonProps } from './components/button/button';
export { Button } from './components/button/button';

// Selection
export type { CheckboxProps } from './components/checkbox/checkbox';
export { Checkbox } from './components/checkbox/checkbox';
export type { SwitchProps } from './components/switch/switch';
export { Switch } from './components/switch/switch';

// Overlay
export type { TooltipProps } from './components/tooltip/tooltip';
export { Tooltip } from './components/tooltip/tooltip';
export type {
  DialogBodyProps,
  DialogFooterProps,
  DialogProps,
  DialogTriggerProps,
} from './composites/dialog/dialog';
export { Dialog } from './composites/dialog/dialog';

// Navigation
export { Tabs } from './composites/tabs/tabs';

// Disclosure
export { Accordion } from './composites/accordion/accordion';

// Structure (FieldFrame)
export type {
  FieldInputProps,
  FieldProps,
  FieldTextareaProps,
} from './composites/field/field';
export { Field } from './composites/field/field';
