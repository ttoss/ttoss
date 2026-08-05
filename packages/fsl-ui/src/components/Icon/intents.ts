/**
 * Icon semantic layer — the intent vocabulary.
 *
 * This is the provider-agnostic contract described by
 * `docs/design/design-system/components/icon-system.md`: an Icon is named by
 * **what it means** (`icon.{family}.{intent}`), never by which glyph or which
 * icon library renders it. The theme (here: the default Lucide mapping in
 * `glyphs.ts`) decides the glyph; this file decides the meanings.
 *
 * Scope (ROADMAP B1): this is intentionally a **subset** of the canonical
 * registry — only the intents that shipped components actually consume today.
 * The registry "grows slowly and shrinks never" (icon-system.md § Change
 * Rules): add an intent here (and its glyph in `glyphs.ts`) when a new
 * component needs one, never speculatively.
 *
 * This module is the seed of the future standalone `@ttoss/fsl-icon` package;
 * it stays free of React and token imports so it can be lifted out whole.
 *
 * @see ../../../CONTRIBUTING.md ADR-005 — Iconify provider + internal intent layer
 * @see docs/design/design-system/components/icon-system.md — full contract
 */

/**
 * The intents currently backed by a glyph, grouped by family. Values are the
 * canonical `{family}.{intent}` identifiers. Adding a member here is a
 * type-level requirement to add its glyph in `INTENT_GLYPHS` (`glyphs.ts`).
 */
export const ICON_INTENTS = [
  // disclosure — expand/collapse. Opposition rule: expand ≠ collapse.
  'disclosure.expand',
  'disclosure.collapse',
  // selection — control states. Opposition rule: checked ≠ indeterminate.
  'selection.checked',
  'selection.indeterminate',
  // action — direct user actions. Opposition rule: increment ≠ decrement.
  'action.close',
  'action.search',
  'action.increment',
  'action.decrement',
  // action — column sort direction. Opposition rule: ascending ≠ descending.
  'action.sortAscending',
  'action.sortDescending',
  // action — additional actions behind a trigger (the overflow affordance).
  // Named for what the user is offered ("more actions"), not for the layout
  // reason it exists; no opposition pair — there is no "fewer".
  'action.more',
  // action — explanatory content behind a trigger (the contextual-help
  // affordance). Named for what the user is offered ("help about this"), not
  // for the glyph that renders it; no opposition pair.
  'action.help',
  // navigation — the affordance that reveals a navigation region that has no
  // room to stand on its own (AppShell's temporary sidebar). Named for what it
  // reveals, not for the three bars that render it; no opposition pair — the
  // panel's own dismissal is `action.close`.
  'navigation.menu',
  // status — foundation status indicators. Opposition rule: success ≠ alert.
  'status.success',
  // The invalid-field mark (the field family's validation glyph) and any
  // "needs attention" indicator.
  'status.alert',
] as const;

/** A semantic icon intent — the public "name" of an icon. */
export type IconIntent = (typeof ICON_INTENTS)[number];
