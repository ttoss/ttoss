/**
 * Layer 1 — Semantic Foundation: Vocabulary
 *
 * Values-first: constants are the source of truth.
 * Types are derived from constants via `typeof … [number]`.
 *
 * No imports — this module is the dependency root of the entire system.
 *
 * @see FSL Lexicon §1–7
 * @see ../tokens/CONTRACT.md — AI-facing guide that consumes this vocabulary
 *   to tell component authors which `vars.*` paths to use per Entity.
 */

// ---------------------------------------------------------------------------
// FSL Dimension Coverage
//
// The FSL Structural Language defines 9 foundational dimensions. FSL §13.3
// authorises a Projection Profile to place each dimension in exactly one of
// three dispositions: CODIFIED, ABSORBED, or DEFERRED. This block documents
// that placement for every dimension so the gap is intentional, not
// accidental.
//
//   Dimension     │ Status   │ Mechanism / Rationale
//   ──────────────┼──────────┼──────────────────────────────────────────────
//   Entity        │ CODIFIED │ ENTITIES, ENTITY_* matrices
//   Structure     │ CODIFIED │ STRUCTURAL_ROLES, ENTITY_STRUCTURE matrix
//   Evaluation    │ CODIFIED │ EVALUATIONS, ENTITY_EVALUATION matrix
//   Composition   │ CODIFIED │ COMPOSITION_ROLES, ENTITY_COMPOSITION matrix
//                 │          │ — behavior-driving (DialogActions reorders
//                 │          │ children by composition per platform).
//   Consequence   │ CODIFIED │ CONSEQUENCES, ENTITY_CONSEQUENCE matrix.
//                 │          │ Profile narrows FSL §6 to { neutral,
//                 │          │ committing, destructive }; see
//                 │          │ fsl-lexicon.md Profile narrowing note.
//                 │          │ — behavior-driving (ConfirmationDialog
//                 │          │ selects confirm mechanism from consequence).
//   State         │ CODIFIED │ STATES tuple enumerates the valid names that
//                 │          │ React Aria render props expose. No
//                 │          │ per-entity matrix — legality is
//                 │          │ runtime-resolved by RAC, not authorially
//                 │          │ declared.
//   Layer         │ ABSORBED │ Fully captured by two existing mechanisms:
//                 │          │   1. Token projection's surfaceType →
//                 │          │      control | surface (radii, border, spacing)
//                 │          │      See ../tokens/projection.ts.
//                 │          │   2. CONTRACT.md §1 Elevation column →
//                 │          │      flat | raised | overlay | blocking
//                 │          │ An independent Layer dimension would be
//                 │          │ redundant — elevation tokens already encode
//                 │          │ layer semantics per entity.
//   Interaction   │ DEFERRED │ Previously codified; removed after 13
//                 │          │ components declared it and zero dispatched
//                 │          │ behavior, coloring, or DOM attributes from
//                 │          │ it.
//                 │          │ Readmission criterion: a component that
//                 │          │ actually dispatches on `InteractionKind` at
//                 │          │ runtime (e.g. Wizard step progression vs.
//                 │          │ Link navigation).
//   Context       │ DEFERRED │ Refinement dimension (density, mode, a11y
//                 │          │ preferences). No prototype exercises it yet.
//                 │          │ Readmission criterion: stabilisation of mode
//                 │          │ switching validated end-to-end via theme-v2.
//
// Status key (FSL §13.3):
//   CODIFIED — Dimension is part of this profile's authorial vocabulary.
//              Legality may be matrix-based or runtime-resolved.
//   ABSORBED — Semantic content is fully captured by other mechanisms in
//              this profile; no independent dimension is needed.
//   DEFERRED — Valid FSL dimension not yet in this profile. Each entry
//              states the readmission criterion that would re-promote it
//              to CODIFIED.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Entity Kind — §1
// "What kind of interactive thing is this?"
// ---------------------------------------------------------------------------

export const ENTITIES = [
  'Action',
  'Input',
  'Selection',
  'Collection',
  'Overlay',
  'Navigation',
  'Disclosure',
  'Feedback',
  'Structure',
] as const;
export type Entity = (typeof ENTITIES)[number];

// ---------------------------------------------------------------------------
// Structural Role — §2
// "What structural function does this part play?"
// ---------------------------------------------------------------------------

// Only roles that appear in at least one ENTITY_STRUCTURE row are listed here.
// FSL Lexicon §2 defines a broader set (media, supportingVisual, trailingMeta,
// leadingAdornment, etc.); those will be admitted when a concrete component
// exercises them. Keeping this set narrow prevents AI authors from selecting
// orphan roles that pass type-checks but fail matrix validation.
export const STRUCTURAL_ROLES = [
  'root',
  'control',
  'surface',
  'content',
  'label',
  'description',
  'title',
  'body',
  'actions',
  'status',
  'icon',
  'indicator',
  'item',
  'trigger',
  'backdrop',
  'positioner',
  'closeTrigger',
  'selectionControl',
  'leadingAdornment',
  'trailingAdornment',
  'validationMessage',
] as const;
export type StructuralRole = (typeof STRUCTURAL_ROLES)[number];

// ---------------------------------------------------------------------------
// Evaluation — §5
// "What evaluative or emphatic meaning is carried?"
// ---------------------------------------------------------------------------

export const EVALUATIONS = [
  'primary',
  'secondary',
  'accent',
  'muted',
  'positive',
  'caution',
  'negative',
] as const;
export type Evaluation = (typeof EVALUATIONS)[number];

// ---------------------------------------------------------------------------
// Composition Role — §4 (FSL Lexicon) / §5.4 (FSL Structural Language)
// "What role does this entity or part play inside a larger composition?"
//
// Composition is relational: it describes the slot/role an entity occupies
// in a parent composite — it never replaces Entity Kind.
//   e.g. an Action with composition=primaryAction = "an Action entity playing
//        the primary-action slot inside some composite (Dialog, Form, …)".
// ---------------------------------------------------------------------------

export const COMPOSITION_ROLES = [
  'primaryAction',
  'secondaryAction',
  'dismissAction',
  'heading',
  'body',
  'status',
  'control',
  'label',
  'description',
  'supporting',
  'selection',
  'step',
  'summary',
  'navigation',
] as const;
export type CompositionRole = (typeof COMPOSITION_ROLES)[number];

// ---------------------------------------------------------------------------
// Consequence — §6
// "What effect on state does this interaction produce?"
//
// Profile-narrowed subset of FSL §6. The full lexicon lists
// `reversible` / `interruptive` / `recoverable` / `safeDefaultRequired`; see
// `fsl-lexicon.md` "Profile narrowing" for why `@ttoss/ui2` codifies only
// the three values below. The narrowing is an invariant of *this* profile
// — a different profile may readmit the rejected values.
// ---------------------------------------------------------------------------

export const CONSEQUENCES = ['neutral', 'committing', 'destructive'] as const;
export type Consequence = (typeof CONSEQUENCES)[number];

// ---------------------------------------------------------------------------
// State — §7
// "What semantic or interactional state is active?"
//
// Note on `invalid` — closes the FSL Lexicon §7 gap for form controls. It is
// a *runtime* state (driven by validation outcome), not an authorial
// emphasis. The mirror distinction to Lexicon §10.5 (`negative` ≠
// `destructive`) is: `invalid` (State) ≠ `negative` (Evaluation). Validation
// feedback is therefore expressed by toggling state, not by re-coloring the
// control via Evaluation. See `ENTITY_EVALUATION` design note below.
// ---------------------------------------------------------------------------

export const STATES = [
  'default',
  'hover',
  'active',
  'focused',
  'disabled',
  'selected',
  'pressed',
  'checked',
  'indeterminate',
  'expanded',
  'current',
  'visited',
  'droptarget',
  'invalid',
] as const;
export type State = (typeof STATES)[number];

// ---------------------------------------------------------------------------
// State Priority — the canonical cascade
//
// Authoritative order for resolving state-dependent tokens, highest priority
// first. Single source of truth for:
//
//   - `src/tokens/resolveInteractiveStyle.ts` (iterates this tuple)
//   - `src/tokens/CONTRACT.md §3` (references it by name)
//   - Contract tests that assert cascade behavior
//
// Each entry binds a React Aria render-prop **flag** to the token-state
// **key** it selects. The flag/state name split is intentional: RAC exposes
// `isHovered` / `isPressed` / `isSelected` / …, while token trees expose
// `hover` / `active` / `checked` / …. The mapping here is the only place
// that knows both vocabularies.
//
// Cascade rationale (each entry dominates everything below it):
//   1. `isDisabled`       — availability overrides every other signal.
//   2. `isInvalid`        — validation outcome (FSL §7, §10.5 parallel);
//                           cannot be surfaced on a disabled control.
//   3. `isExpanded`       — Disclosure state; dominates selection/focus
//                           chrome so an open disclosure wins over hover.
//   4. `isIndeterminate`  — tri-state supersedes plain `checked`.
//   5. `isSelected`       — Selection entity's persistent chosen state.
//   6. `isFocusVisible`   — keyboard-focus ring must beat transient
//                           pointer states.
//   7. `isPressed`        — transient press beats hover.
//   8. `isHovered`        — pointer proximity.
//   9. (default)          — implicit fallback when no flag is active.
//
// `default` is not an entry because it has no flag — it is the resting
// value returned when the cascade exhausts. The helper reads `states.default`
// after iterating.
// ---------------------------------------------------------------------------

export const STATE_PRIORITY = [
  { flag: 'isDisabled', state: 'disabled' },
  { flag: 'isInvalid', state: 'invalid' },
  { flag: 'isExpanded', state: 'expanded' },
  { flag: 'isIndeterminate', state: 'indeterminate' },
  { flag: 'isSelected', state: 'checked' },
  { flag: 'isFocusVisible', state: 'focused' },
  { flag: 'isPressed', state: 'active' },
  { flag: 'isHovered', state: 'hover' },
] as const;

/** React Aria render-prop flag names driven by the cascade. */
export type InteractiveFlag = (typeof STATE_PRIORITY)[number]['flag'];

/** Token-state keys the cascade maps flags into (plus `default` fallback). */
export type InteractiveStateKey =
  | (typeof STATE_PRIORITY)[number]['state']
  | 'default';

// ---------------------------------------------------------------------------
// Legality Matrices
// "What combinations of terms are valid?"
//
// These are part of the taxonomy — you cannot define what Entity means without
// saying which StructuralRoles are legal for it. Same knowledge, same module.
// ---------------------------------------------------------------------------

/** Which structural roles are legal for each entity. */
export const ENTITY_STRUCTURE = {
  Action: ['root', 'control', 'icon', 'label'],
  Input: [
    'root',
    'control',
    'label',
    'description',
    'leadingAdornment',
    'trailingAdornment',
    'validationMessage',
  ],
  Selection: [
    'root',
    'control',
    'label',
    'indicator',
    'selectionControl',
    'item',
  ],
  Collection: ['root', 'surface', 'content', 'item', 'title', 'actions'],
  Overlay: [
    'root',
    'surface',
    'content',
    'title',
    'body',
    'actions',
    'backdrop',
    'positioner',
    'closeTrigger',
  ],
  Navigation: ['root', 'control', 'label', 'icon', 'indicator', 'item'],
  Disclosure: ['root', 'trigger', 'content', 'icon', 'indicator'],
  Feedback: [
    'root',
    'content',
    'icon',
    'title',
    'body',
    'actions',
    'status',
    'closeTrigger',
  ],
  Structure: [
    'root',
    'surface',
    'content',
    'title',
    'body',
    'label',
    'description',
    'icon',
    'actions',
  ],
} as const satisfies Record<Entity, ReadonlyArray<StructuralRole>>;

/**
 * Which evaluations are legal for each entity.
 *
 * Design note — `Input` and `Selection` carry **no** evaluations. Form
 * controls are data-entry surfaces, not decision hierarchies: there is no
 * authorial choice between `primary`/`secondary`/`muted` for a text field or
 * a checkbox, and validation outcome is not authorial either — it is a
 * runtime fact emitted by a form library or a `validate()` callback.
 *
 * The vocabulary distinction:
 *   - `Evaluation` (this matrix) is **authorial emphasis/valence**.
 *   - `State.invalid` (see `STATES`) is the **runtime validation outcome**.
 *
 * This mirrors the Lexicon §10.5 distinction `negative ≠ destructive`:
 * evaluation lives in the author's pen, state lives in the user's data. By
 * keeping the two separate the system avoids the shape where a developer is
 * tempted to write `<TextField evaluation="negative">` to express a
 * validation error — that is a category mistake. The correct expression is
 * `<TextField isInvalid />`, which flips the `invalid` state and lets the
 * single neutral chrome become the canonical validation surface.
 *
 * Adjacent slots (description, icon, validationMessage) may still consume
 * `vars.colors.input.{positive|caution|negative}` directly when they need
 * valence — those are *display* of validation context, not the control
 * itself.
 *
 * Consensus pattern across React Aria (`isInvalid`), Adobe Spectrum
 * (`validationState`), Material UI (`error`), Ant Design (`status`), and
 * shadcn/ui (`aria-invalid`): validation is exposed as boolean state on the
 * control, not as a coloring variant.
 */
export const ENTITY_EVALUATION = {
  Action: ['primary', 'secondary', 'accent', 'muted', 'negative'],
  Input: [],
  Selection: [],
  Collection: ['primary', 'muted'],
  Overlay: ['primary', 'secondary', 'accent', 'muted', 'negative'],
  Navigation: ['primary', 'secondary', 'accent', 'muted'],
  Disclosure: ['primary', 'muted'],
  Feedback: ['primary', 'positive', 'caution', 'negative'],
  Structure: ['primary', 'muted'],
} as const satisfies Record<Entity, ReadonlyArray<Evaluation>>;

/**
 * Which composition roles an entity of this kind may play inside a parent
 * composite. `[]` means the entity is a host or leaf: it does not participate
 * in a larger composition as a slot-bearing child.
 *
 * Readmit roles per-entity only when a concrete component exercises the slot.
 */
export const ENTITY_COMPOSITION = {
  Action: ['primaryAction', 'secondaryAction', 'dismissAction'],
  Input: ['control', 'label', 'description', 'status', 'supporting'],
  Selection: ['control', 'selection', 'label', 'description'],
  Collection: [],
  Overlay: ['heading', 'body'],
  Navigation: [],
  // Disclosure entities (Accordion + items) carry no composition today —
  // no runtime in `Accordion` dispatches on composition (no DOM reorder,
  // no slot-based selection). The vocabulary stays empty per the evidence
  // rule (CONTRIBUTING §2.3 / docs comment above): readmit `'control'`
  // here only when a concrete Disclosure component exercises the slot.
  Disclosure: [],
  Feedback: ['status'],
  Structure: [
    'heading',
    'body',
    'label',
    'description',
    'supporting',
    'step',
    'summary',
    'navigation',
  ],
} as const satisfies Record<Entity, ReadonlyArray<CompositionRole>>;

/**
 * Which consequence values are legal for each entity.
 *
 * `Action` is the only entity whose interactions produce authorial effect-
 * on-state today (`committing` submits, `destructive` deletes, `neutral`
 * everything else). Other entities' interactions — input entry, navigation
 * — do not carry the same authorial "what does this do" meta and are
 * intentionally left empty.
 */
export const ENTITY_CONSEQUENCE = {
  Action: ['neutral', 'committing', 'destructive'],
  Input: [],
  Selection: [],
  Collection: [],
  Overlay: [],
  Navigation: [],
  Disclosure: [],
  Feedback: [],
  Structure: [],
} as const satisfies Record<Entity, ReadonlyArray<Consequence>>;

// ---------------------------------------------------------------------------
// Derived type utilities
// ---------------------------------------------------------------------------

/** Structural roles that are legal for entity E. */
export type StructuresFor<E extends Entity> =
  (typeof ENTITY_STRUCTURE)[E][number];

/** Evaluations that are legal for entity E. */
export type EvaluationsFor<E extends Entity> =
  (typeof ENTITY_EVALUATION)[E][number];

/** Composition roles that are legal for entity E. */
export type CompositionsFor<E extends Entity> =
  (typeof ENTITY_COMPOSITION)[E][number];

/** Consequence values that are legal for entity E. */
export type ConsequencesFor<E extends Entity> =
  (typeof ENTITY_CONSEQUENCE)[E][number];
