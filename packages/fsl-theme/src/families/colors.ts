/* ==========================================================================
 * Colors — Core palettes + Semantic color grammar.
 *
 * Semantic color token grammar: `{ux}.{role}.{dimension}.{state}`
 *   - ux:        action | input | navigation | feedback | informational
 *   - role:      primary | secondary | accent | muted | positive | caution | negative
 *   - dimension: background | border | text  (per component; not all are required)
 *   - state:     default | hover | active | focused | disabled | selected | …
 *
 * @see /docs/website/docs/design/design-system/design-tokens/families/colors.md
 * ========================================================================== */

import type { CoreColorRef, RawValue } from './primitives';

// -- Core Colors ------------------------------------------------------------

/**
 * Unified color scale steps (0–1000).
 * Themes may use any subset; step 500 is always required as the canonical mid-point.
 */
type CoreColorStep =
  | 0
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 1000;

/**
 * Palette scale — partial record over CoreColorStep with 500 required.
 * Sparse palettes (100/300/500/700/900) and dense palettes (0–1000) both conform.
 */
type CoreColorScale = Partial<Record<CoreColorStep, RawValue>> & {
  500: RawValue;
};

/**
 * Core color tokens — intent-free palette primitives.
 *
 * Rules:
 * - Core names define palette families and scale positions, never usage.
 * - No semantic naming (no `danger`, `warning`, `link`, `surface`, etc.).
 * - No mode naming (core values are immutable across modes).
 * - No component naming (no `cardBg`, `inputBorder`, etc.).
 *
 * @see colors.md
 */
export interface CoreColors {
  /** Primary brand identity color scale. */
  brand: CoreColorScale;
  /**
   * Zero-saturation anchor scale (greyscale/slate).
   * Provides surfaces, text contrast, dividers, and subdued UI.
   * Named `neutral` by convention — not a semantic role, purely a palette family.
   * Use step 0 for white-end and step 1000 for black-end.
   */
  neutral: CoreColorScale;
  /**
   * Open hue families. Themes define which they need (red, green, yellow, blue, etc.).
   * No fixed set is required beyond `brand` and `neutral`.
   */
  [hue: string]: CoreColorScale;
}

// -- Semantic Color states (per UX context) ---------------------------------

/** Base interaction states — available in every UX context.
 *  `selected` is NOT included here — it is added only by the UX contexts
 *  where set-membership semantics apply (input, navigation, informational).
 *  Action context uses `pressed` for toggle state instead (FSL Lexicon §7).
 */
interface BaseColorStates {
  /** Resting / base state. The colour rendered when no other state asserts. */
  default: CoreColorRef;
  /** Pointer is currently over the element. Do not use for keyboard focus — that is `focused`. */
  hover?: CoreColorRef;
  /** Pointer or key is currently *down* on the element — transient, lasts only while held. Releases back to `default` / `hover`. Do not use for persistent toggle state — that is `pressed`. */
  active?: CoreColorRef;
  /** Element has keyboard or programmatic focus. Pair with `semantic.focus.ring.color` when no `{ux}.{role}` context applies. */
  focused?: CoreColorRef;
  /** Element is non-interactive. Carries the contrast guarantees that `semantic.opacity.disabled` cannot — prefer this for controls and text over opacity. */
  disabled?: CoreColorRef;
  /**
   * Valid drag-and-drop destination during an active drag (FSL Lexicon §7).
   * Applies wherever drop-target semantics are valid: file inputs, collection rows,
   * informational surfaces, and any other entity that accepts dropped items.
   */
  droptarget?: CoreColorRef;
}

/** `action` context: adds `pressed` for toggle controls and `expanded` for disclosure triggers and open menus. */
interface ActionColorStates extends BaseColorStates {
  /** Toggle button is currently engaged — *persistent*, not transient. Use for toolbar toggles ("Bold" pressed). Do not confuse with `active` (the brief moment of clicking). */
  pressed?: CoreColorRef;
  /** Disclosure trigger or menu button is currently open. Use for buttons that own an open popup, menu, or panel. */
  expanded?: CoreColorRef;
}

/** `input` context: adds `checked`, `indeterminate`, `pressed`, `expanded` for form controls.
 *
 * Validation failure is *not* a state — it is an Evaluation (FSL Lexicon §5).
 * Components that fail validation render with the `input.negative.*` role,
 * not with an `invalid` state on `input.primary.*`. This avoids dual
 * representation of the same semantic concept and keeps FSL §7 State Law
 * intact ("States are not free-form"). React Aria's `isInvalid` flag maps
 * to selecting the `negative` role, not to a new state.
 *
 * Structural Role → token mapping (FSL Lexicon §2): a part declared with
 * Structural Role `validationMessage` consumes `input.negative.text.*` for
 * its text dimension (and `input.negative.{background,border}.*` if it
 * carries those dimensions). `validationMessage` is anatomy (which part);
 * `input.negative.*` is the visual contract (which value). The same
 * Evaluation token lawfully serves multiple Structural Roles — this is the
 * intended single-source semantics, not duplication. */
interface InputColorStates extends BaseColorStates {
  /** Element is **one of many** in a set and the user picked it (segment in a segmented control, picker option). Do not use for two-state controls — those are `checked`. */
  selected?: CoreColorRef;
  /** **Two-state control** that is currently on — checkbox, radio, switch. Do not use for selection from a set — that is `selected`. */
  checked?: CoreColorRef;
  /** Boolean control in a mixed / unknown state — e.g. parent checkbox over partially-checked children. */
  indeterminate?: CoreColorRef;
  /** Persistent engaged state of a toggle-style input (e.g. a switch rendered as a button). See `ActionColorStates.pressed` for the disambiguation against `active`. */
  pressed?: CoreColorRef;
  /** Combobox / select / disclosure-style input is currently open. */
  expanded?: CoreColorRef;
}

/** `navigation` context: adds `selected`, `current`, `visited`, `expanded`. */
interface NavigationColorStates extends BaseColorStates {
  /** Tab / item is **one of many** in the set and the user picked it. May coexist with `current` when the selected item also represents the live route. */
  selected?: CoreColorRef;
  /** Element is the user's **current location** in the navigation set — active route, current step in a wizard. Do not use for set-membership without a routing meaning — that is `selected`. */
  current?: CoreColorRef;
  /** Link points to a URL the user has visited. */
  visited?: CoreColorRef;
  /** Disclosure-style nav item (collapsible section, expandable submenu) is currently open. */
  expanded?: CoreColorRef;
}

/** `informational` context: adds `selected`, `visited`, `expanded`.
 *
 * `expanded` covers in-place disclosure on presentational surfaces (accordions,
 * collapsible panels, expandable cards). `Disclosure` Entity Kinds project to
 * `informational` per FSL identity (in-place reveal, not movement across
 * destinations — FSL Lexicon §1). */
interface InformationalColorStates extends BaseColorStates {
  /** Presentational element is **one of many** and the user picked it (selectable list row, focused card in a deck). */
  selected?: CoreColorRef;
  /** Visited link rendered inside informational content. */
  visited?: CoreColorRef;
  /** Accordion / collapsible panel / `<details>` is currently open — in-place reveal (FSL Lexicon §1). */
  expanded?: CoreColorRef;
}

/**
 * `feedback` context state set — feedback components are not interactive triggers (FSL §7).
 * Legal states: `default`, `focused` (focusable wrapper or close button), `disabled`.
 * `hover`, `active`, `selected`, `pressed`, `expanded`, `droptarget` are illegal.
 */
interface FeedbackColorStates {
  /** Resting / base state. The colour rendered when no other state asserts. */
  default: CoreColorRef;
  /** Element has keyboard or programmatic focus — e.g. a focusable close button inside the feedback component. */
  focused?: CoreColorRef;
  /** Element is non-interactive. Prefer this over `opacity.disabled` for controls and text that carry colour contrast guarantees. */
  disabled?: CoreColorRef;
}

/**
 * Color dimensions for a given UX context.
 * Each dimension is optional — components choose which they consume.
 * (e.g. a text link uses only `text`; a ghost button uses `text` + `border`)
 */
interface ColorDimensionOf<S extends BaseColorStates> {
  /** Fills and surface backgrounds. Use for any colored area larger than a line. */
  background?: S;
  /** Outlines, separators, rings, and other line-color pairings. For line *geometry* (width, style) consume `semantic.borders.*` instead — this dimension is colour only. */
  border?: S;
  /** Readable foreground — labels, paragraphs, and text-like icons that inherit `currentColor`. */
  text?: S;
}

/** `action`: triggers actions or changes state. Roles: primary | secondary | accent | muted | negative */
interface ActionColorRoles {
  /** The single most important action on the view. Only one `primary` per `{ux}` per view — if two compete, the loser is `secondary`. */
  primary: ColorDimensionOf<ActionColorStates>;
  /** Alternative action that coexists with the primary one. Use when two actions share the surface and neither dominates. */
  secondary: ColorDimensionOf<ActionColorStates>;
  /** Highlighted action that draws attention without being the main path ("Try the new…" promo button). */
  accent: ColorDimensionOf<ActionColorStates>;
  /** Low-priority action — helper button, optional control, dismiss / cancel ghost. */
  muted: ColorDimensionOf<ActionColorStates>;
  /** Action whose intent is adverse: failure, invalid result, or destructive consequence (delete, cancel paid plan). Outcome (success / warning) lives in `feedback.*`, not here. */
  negative: ColorDimensionOf<ActionColorStates>;
}

/** `input`: data entry, selection, form controls. Roles: primary | secondary | muted | positive | caution | negative */
interface InputColorRoles {
  /** Default input role — the brand-influenced active style for the canonical control on the form. */
  primary: ColorDimensionOf<InputColorStates>;
  /** Alternative input role coexisting with `primary` — e.g. a secondary search field on the same surface. */
  secondary: ColorDimensionOf<InputColorStates>;
  /** Low-priority input — quiet text field, ghost search, optional metadata input. */
  muted: ColorDimensionOf<InputColorStates>;
  /** Input whose value reports success / completion / validity confirmed (e.g. "available" username field after async check). */
  positive: ColorDimensionOf<InputColorStates>;
  /** Input whose value carries risk that needs attention but does not block submission. */
  caution: ColorDimensionOf<InputColorStates>;
  /** Input whose value failed validation — maps from React Aria `isInvalid`. Validation failure is *not* a state on `primary`; it selects this role (FSL Lexicon §5). */
  negative: ColorDimensionOf<InputColorStates>;
}

/** `navigation`: movement and orientation. Roles: primary | secondary | accent | muted */
interface NavigationColorRoles {
  /** The dominant navigation surface on the view — main top nav, primary sidebar. */
  primary: ColorDimensionOf<NavigationColorStates>;
  /** Secondary navigation that coexists with the primary one — sub-nav, in-page tabs. */
  secondary: ColorDimensionOf<NavigationColorStates>;
  /** Highlighted nav item that draws attention without being the main path — "What's new", featured destination. */
  accent: ColorDimensionOf<NavigationColorStates>;
  /** Low-priority nav — footer links, breadcrumb separators, optional sub-items. */
  muted: ColorDimensionOf<NavigationColorStates>;
}

/** `feedback`: reactive system/user-result messages. Roles: primary | muted | positive | caution | negative */
interface FeedbackColorRoles {
  /** Neutral / informational feedback that carries no valence — "Auto-saved", "Connected". */
  primary: ColorDimensionOf<FeedbackColorStates>;
  /** Quiet feedback that should not steal attention — inline hints, low-priority status text. */
  muted: ColorDimensionOf<FeedbackColorStates>;
  /** Feedback reporting success, completion, or validity confirmed. */
  positive: ColorDimensionOf<FeedbackColorStates>;
  /** Feedback reporting risk that needs attention but does not block the user. */
  caution: ColorDimensionOf<FeedbackColorStates>;
  /** Feedback reporting failure or an invalid system state. */
  negative: ColorDimensionOf<FeedbackColorStates>;
}

/** `informational`: informational surfaces and readable content. Roles: primary | secondary | accent | muted | positive | caution | negative */
interface InformationalColorRoles {
  /** Dominant content / surface on the view — page background, main panel, the card the user is reading. */
  primary: ColorDimensionOf<InformationalColorStates>;
  /** Supporting content / surface coexisting with `primary` — sidebar panel, secondary card. */
  secondary: ColorDimensionOf<InformationalColorStates>;
  /** Highlighted content that draws attention without being the main path — featured callout, promo tile. */
  accent: ColorDimensionOf<InformationalColorStates>;
  /** Low-priority content — helper text, dividers, captions, metadata. */
  muted: ColorDimensionOf<InformationalColorStates>;
  /** Informational surface or text reporting success / completion (e.g. "All up to date" empty state). */
  positive: ColorDimensionOf<InformationalColorStates>;
  /** Informational surface or text carrying caution — warning panel, advisory note. */
  caution: ColorDimensionOf<InformationalColorStates>;
  /** Informational surface or text reporting failure or invalid state — error empty state, broken-state panel. */
  negative: ColorDimensionOf<InformationalColorStates>;
}

/**
 * Semantic colour API — the only colour contract components consume.
 *
 * Pick the UX context by asking *what kind of UI is this?* (colors.md §"UX contexts in 60 seconds"):
 * is the user about to **act**, **type**, **move**, **hear back**, or just **see / contain** something?
 *
 * Token grammar: `{ux}.{role}.{dimension}.{state}`. Legal combinations are
 * enforced by the type system; see colors.md §Legal Combinations.
 *
 * @see colors.md
 */
export interface SemanticColors {
  /** Anything the user **triggers** — buttons, toggles, menu items, action icons. Pick when the user is about to *act*. */
  action: ActionColorRoles;
  /** Anything the user **enters or selects data into** — text fields, selects, checkboxes, radios. Pick when the user is about to *type / pick a value*. */
  input: InputColorRoles;
  /** Anything that **moves the user** between views or sections — links, tabs, breadcrumbs, pagination. Pick when the user is about to *go somewhere*. */
  navigation: NavigationColorRoles;
  /** Surfaces that **report the outcome** of an action or system event — toasts, alerts, banners, inline validation. Pick when the system is *reporting back*. */
  feedback: FeedbackColorRoles;
  /**
   * **Presentational surfaces** — hold, group, layer, frame, or display content; never drive a transaction.
   * Body text, page backgrounds, cards, panels, dialogs, dividers, list rows, accordions.
   * Interactivity is not a tiebreaker: a focusable Card or expandable accordion is still `informational` —
   * its purpose is presentational. Focusability is covered by `semantic.focus.ring.*`; disclosure by the `expanded` state.
   */
  informational: InformationalColorRoles;
}
