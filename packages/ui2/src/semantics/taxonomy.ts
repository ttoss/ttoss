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
// The FSL Structural Language defines 9 foundational dimensions.
// This taxonomy codifies 6. The remaining 3 have explicit dispositions
// documented below so the gap is intentional, not accidental.
//
//   Dimension     │ Status   │ Mechanism / Rationale
//   ──────────────┼──────────┼──────────────────────────────────────────────
//   Entity        │ CODIFIED │ ENTITIES, ENTITY_* matrices
//   Structure     │ CODIFIED │ STRUCTURAL_ROLES, ENTITY_STRUCTURE matrix
//   Interaction   │ CODIFIED │ INTERACTION_KINDS, ENTITY_INTERACTION matrix
//   Evaluation    │ CODIFIED │ EVALUATIONS, ENTITY_EVALUATION matrix
//   Composition   │ CODIFIED │ COMPOSITION_ROLES, ENTITY_COMPOSITION matrix
//   State         │ CODIFIED │ STATES, INTERACTION_STATE matrix
//   Consequence   │ DEFERRED │ Not codified. Will be added (vocabulary +
//                 │          │ ENTITY_CONSEQUENCE matrix + ComponentMeta
//                 │          │ slot + validation) when destructive action
//                 │          │ patterns are prototyped (e.g. DeleteButton,
//                 │          │ ConfirmDialog). Kept out of SemanticExpression
//                 │          │ to avoid phantom vocabulary.
//   Layer         │ ABSORBED │ Fully captured by two existing mechanisms:
//                 │          │   1. ENTITY_TOKEN_MAPPING.surfaceType →
//                 │          │      control | surface (radii, border, spacing)
//                 │          │   2. CONTRACT.md §1 Elevation column →
//                 │          │      flat | raised | overlay | blocking
//                 │          │ An independent Layer dimension would be
//                 │          │ redundant — elevation tokens already encode
//                 │          │ layer semantics per entity.
//   Context       │ DEFERRED │ Refinement dimension (density, mode, a11y
//                 │          │ preferences). No prototype exercises it yet.
//                 │          │ Will stabilize after mode switching is
//                 │          │ validated end-to-end via theme-v2.
//
// Status key:
//   CODIFIED — Dimension is implemented with constants and legality matrices.
//   ABSORBED — Semantic content is captured by existing mechanisms.
//              No dedicated dimension needed.
//   DEFERRED — Valid dimension, not yet stabilized. Will be added when
//              sufficient prototypes prove the pattern.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cognitive Mode → UX Context Mapping (CONTRACT.md §1.1)
//
// Each Entity maps to a UX color context via the user's primary cognitive mode:
//
//   Cognitive Mode  │ UX Context      │ Entities
//   ────────────────┼─────────────────┼────────────────────────
//   Deciding        │ action          │ Action
//   Providing       │ input           │ Input, Selection
//   Orienting       │ navigation      │ Navigation, Disclosure
//   Receiving       │ feedback        │ Feedback
//   Reading         │ informational   │ Overlay, Collection, Structure
//
// Surface type (control vs surface) derives all non-color token columns.
// See CONTRACT.md §1.1 for the full derivation rules.
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
// Interaction Kind — §3
// "What kind of interaction is being expressed?"
// ---------------------------------------------------------------------------

export const INTERACTION_KINDS = [
  'command',
  'confirm',
  'dismiss',
  'entry.text',
  'entry.value',
  'select.single',
  'select.multi',
  'toggle.binary',
  'toggle.tristate',
  'navigate.link',
  'navigate.step',
  'disclose.toggle',
] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

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
] as const;
export type CompositionRole = (typeof COMPOSITION_ROLES)[number];

// ---------------------------------------------------------------------------
// Consequence — §6 (DEFERRED — see FSL Dimension Coverage table above)
// Intentionally not codified until a destructive-action prototype exists.
// ---------------------------------------------------------------------------

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
  Disclosure: ['control'],
  Feedback: ['status'],
  Structure: ['heading', 'body', 'label', 'description', 'supporting'],
} as const satisfies Record<Entity, ReadonlyArray<CompositionRole>>;

// ---------------------------------------------------------------------------
// Cognitive Mode → UX Context → Entity (CONTRACT.md §1.1)
//
// This constant codifies the mapping rationale. It is the single source of
// truth for which UX color context an Entity belongs to.
// The discriminant question: "What is the user's primary cognitive mode?"
// ---------------------------------------------------------------------------

/**
 * User cognitive modes — the discriminant for Entity → UX context grouping.
 * @see CONTRACT.md §1.1 — Mapping Rationale
 */
export const COGNITIVE_MODES = [
  'deciding',
  'providing',
  'orienting',
  'receiving',
  'reading',
] as const;
export type CognitiveMode = (typeof COGNITIVE_MODES)[number];

/**
 * UX color contexts — the Colors column of CONTRACT.md §1.
 * Each context corresponds to a `vars.colors.{ux}` subtree in theme-v2.
 */
export const UX_CONTEXTS = [
  'action',
  'input',
  'navigation',
  'feedback',
  'informational',
] as const;
export type UxContext = (typeof UX_CONTEXTS)[number];

/**
 * Surface types — derives all non-color token columns (Radii, Border, Sizing, Spacing).
 *
 * - `control`: user operates this directly (hit targets, control radii)
 * - `surface`: carries content for the user (surface radii, no hit sizing)
 */
export const SURFACE_TYPES = ['control', 'surface'] as const;
export type SurfaceType = (typeof SURFACE_TYPES)[number];

/**
 * The full Entity → token derivation record.
 *
 * Given an Entity, this tells you:
 * - `cognitiveMode`: *why* this entity belongs to its UX context
 * - `uxContext`: which `vars.colors.{ux}` subtree to use
 * - `surfaceType`: which non-color token family to use (control vs surface)
 */
export const ENTITY_TOKEN_MAPPING = {
  Action: {
    cognitiveMode: 'deciding',
    uxContext: 'action',
    surfaceType: 'control',
    intent: 'Triggers an effect; user weighs consequence before committing.',
  },
  Input: {
    cognitiveMode: 'providing',
    uxContext: 'input',
    surfaceType: 'control',
    intent: 'Accepts freeform data the user supplies to the system.',
  },
  Selection: {
    cognitiveMode: 'providing',
    uxContext: 'input',
    surfaceType: 'control',
    intent: 'Accepts a constrained choice from a predefined set.',
  },
  Navigation: {
    cognitiveMode: 'orienting',
    uxContext: 'navigation',
    surfaceType: 'control',
    intent: 'Moves the user across destinations in an information space.',
  },
  Disclosure: {
    cognitiveMode: 'orienting',
    uxContext: 'navigation',
    surfaceType: 'control',
    intent: 'Reveals or hides structure in place without navigating away.',
  },
  Overlay: {
    cognitiveMode: 'reading',
    uxContext: 'informational',
    surfaceType: 'surface',
    intent: 'Temporary content elevated above the page for focused reading.',
  },
  Feedback: {
    cognitiveMode: 'receiving',
    uxContext: 'feedback',
    surfaceType: 'surface',
    intent: 'Communicates a system-initiated status or outcome to the user.',
  },
  Collection: {
    cognitiveMode: 'reading',
    uxContext: 'informational',
    surfaceType: 'surface',
    intent: 'Groups related items into a scannable set.',
  },
  Structure: {
    cognitiveMode: 'reading',
    uxContext: 'informational',
    surfaceType: 'surface',
    intent: 'Organizational frame that carries other content.',
  },
} as const satisfies Record<
  Entity,
  {
    cognitiveMode: CognitiveMode;
    uxContext: UxContext;
    surfaceType: SurfaceType;
    /** One-line rationale — why this Entity belongs to its cognitive mode. */
    intent: string;
  }
>;

/** UX color context for a given Entity. */
export type UxContextFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['uxContext'];

/** Surface type for a given Entity. */
export type SurfaceTypeFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['surfaceType'];

/** Which interaction kinds are legal for each entity. */
export const ENTITY_INTERACTION = {
  Action: ['command', 'confirm', 'dismiss'],
  Input: ['entry.text', 'entry.value'],
  Selection: [
    'select.single',
    'select.multi',
    'toggle.binary',
    'toggle.tristate',
  ],
  Collection: [],
  Overlay: [],
  Navigation: ['navigate.link', 'navigate.step'],
  Disclosure: ['disclose.toggle'],
  Feedback: ['dismiss'],
  Structure: [],
} as const satisfies Record<Entity, ReadonlyArray<InteractionKind>>;

/** Which states are legal for each interaction kind. */
export const INTERACTION_STATE = {
  command: ['default', 'hover', 'active', 'focused', 'disabled', 'pressed'],
  confirm: ['default', 'hover', 'active', 'focused', 'disabled'],
  dismiss: ['default', 'hover', 'active', 'focused', 'disabled'],
  'entry.text': ['default', 'hover', 'focused', 'disabled', 'invalid'],
  'entry.value': ['default', 'hover', 'focused', 'disabled', 'invalid'],
  'select.single': [
    'default',
    'hover',
    'focused',
    'disabled',
    'selected',
    'expanded',
    'invalid',
  ],
  'select.multi': [
    'default',
    'hover',
    'focused',
    'disabled',
    'selected',
    'checked',
    'indeterminate',
    'invalid',
  ],
  'toggle.binary': [
    'default',
    'hover',
    'active',
    'focused',
    'disabled',
    'checked',
    'pressed',
    'invalid',
  ],
  'toggle.tristate': [
    'default',
    'hover',
    'active',
    'focused',
    'disabled',
    'checked',
    'indeterminate',
    'invalid',
  ],
  'navigate.link': [
    'default',
    'hover',
    'active',
    'focused',
    'disabled',
    'current',
    'visited',
  ],
  'navigate.step': ['default', 'hover', 'focused', 'disabled', 'current'],
  'disclose.toggle': ['default', 'hover', 'focused', 'disabled', 'expanded'],
} as const satisfies Record<InteractionKind, ReadonlyArray<State>>;

// ---------------------------------------------------------------------------
// Derived type utilities
// ---------------------------------------------------------------------------

/** Structural roles that are legal for entity E. */
export type StructuresFor<E extends Entity> =
  (typeof ENTITY_STRUCTURE)[E][number];

/** Interaction kinds that are legal for entity E. */
export type InteractionsFor<E extends Entity> =
  (typeof ENTITY_INTERACTION)[E][number];

/** States that are legal for interaction kind K. */
export type StatesFor<K extends InteractionKind> =
  (typeof INTERACTION_STATE)[K][number];

/** Evaluations that are legal for entity E. */
export type EvaluationsFor<E extends Entity> =
  (typeof ENTITY_EVALUATION)[E][number];

/** Composition roles that are legal for entity E. */
export type CompositionsFor<E extends Entity> =
  (typeof ENTITY_COMPOSITION)[E][number];

// ---------------------------------------------------------------------------
// Semantic Expression — §8
// Discriminated union: entity narrows structure and interaction at compile time.
// ---------------------------------------------------------------------------

export type SemanticExpression = {
  [E in Entity]: {
    /** What kind of interactive thing is this? (FSL §1) */
    entity: E;
    /** What structural function does the root part play? (FSL §2) */
    structure: StructuresFor<E>;
    /** What kind of interaction does it express? (FSL §3 — optional) */
    interaction?: InteractionsFor<E>;
    /** Semantic emphasis or valence. (FSL §5 — optional) */
    evaluation?: EvaluationsFor<E>;
    /** Slot played inside a parent composition. (FSL §4 — optional) */
    composition?: CompositionsFor<E>;
  };
}[Entity];

/**
 * Validates a SemanticExpression against the legality matrices.
 * Returns an array of error messages. Empty array means the expression is valid.
 *
 * Covers every dimension present in the expression: `structure` against
 * `ENTITY_STRUCTURE`, `interaction` against `ENTITY_INTERACTION`,
 * `evaluation` against `ENTITY_EVALUATION`, and `composition` against
 * `ENTITY_COMPOSITION`.
 */
export const validateExpression = (expr: SemanticExpression): string[] => {
  const errors: string[] = [];

  const legalStructures = ENTITY_STRUCTURE[
    expr.entity
  ] as ReadonlyArray<string>;
  if (!legalStructures.includes(expr.structure)) {
    errors.push(
      `"${expr.structure}" is not a legal structure for "${expr.entity}" ` +
        `(legal: ${legalStructures.join(', ')})`
    );
  }

  if (expr.interaction !== undefined) {
    const legalInteractions = ENTITY_INTERACTION[
      expr.entity
    ] as ReadonlyArray<string>;
    if (!legalInteractions.includes(expr.interaction)) {
      const hint =
        legalInteractions.length > 0
          ? legalInteractions.join(', ')
          : 'none — this entity has no interaction semantics';
      errors.push(
        `"${expr.interaction}" is not a legal interaction for "${expr.entity}" (legal: ${hint})`
      );
    }
  }

  if (expr.evaluation !== undefined) {
    const legalEvaluations = ENTITY_EVALUATION[
      expr.entity
    ] as ReadonlyArray<string>;
    if (!legalEvaluations.includes(expr.evaluation)) {
      errors.push(
        `"${expr.evaluation}" is not a legal evaluation for "${expr.entity}" ` +
          `(legal: ${legalEvaluations.join(', ')})`
      );
    }
  }

  if (expr.composition !== undefined) {
    const legalCompositions = ENTITY_COMPOSITION[
      expr.entity
    ] as ReadonlyArray<string>;
    if (!legalCompositions.includes(expr.composition)) {
      const hint =
        legalCompositions.length > 0
          ? legalCompositions.join(', ')
          : 'none — this entity does not play a composition slot';
      errors.push(
        `"${expr.composition}" is not a legal composition for "${expr.entity}" (legal: ${hint})`
      );
    }
  }

  return errors;
};
