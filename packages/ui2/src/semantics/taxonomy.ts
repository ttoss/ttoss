/**
 * Layer 1 — Semantic Foundation: Vocabulary
 *
 * Values-first: constants are the source of truth.
 * Types are derived from constants via `typeof … [number]`.
 *
 * No imports — this module is the dependency root of the entire system.
 *
 * @see FSL Lexicon §1–7
 */

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
  'supportingVisual',
  'trailingMeta',
  'selectionControl',
  'media',
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
// Consequence — §6
// "What user-facing consequence or risk profile is carried?"
// ---------------------------------------------------------------------------

export const CONSEQUENCES = [
  'neutral',
  'reversible',
  'committing',
  'destructive',
  'interruptive',
  'recoverable',
  'safeDefaultRequired',
] as const;
export type Consequence = (typeof CONSEQUENCES)[number];

// ---------------------------------------------------------------------------
// State — §7
// "What semantic or interactional state is active?"
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

/** Which evaluations are legal for each entity. */
export const ENTITY_EVALUATION = {
  Action: ['primary', 'secondary', 'accent', 'muted', 'negative'],
  Input: ['primary', 'secondary', 'muted', 'positive', 'caution', 'negative'],
  Selection: ['primary', 'secondary', 'muted', 'positive', 'negative'],
  Collection: ['primary', 'muted'],
  Overlay: ['primary'],
  Navigation: ['primary', 'secondary', 'accent', 'muted'],
  Disclosure: ['primary', 'muted'],
  Feedback: ['primary', 'positive', 'caution', 'negative'],
  Structure: ['primary', 'muted'],
} as const satisfies Record<Entity, ReadonlyArray<Evaluation>>;

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
  'entry.text': ['default', 'hover', 'focused', 'disabled'],
  'entry.value': ['default', 'hover', 'focused', 'disabled'],
  'select.single': [
    'default',
    'hover',
    'focused',
    'disabled',
    'selected',
    'expanded',
  ],
  'select.multi': [
    'default',
    'hover',
    'focused',
    'disabled',
    'selected',
    'checked',
    'indeterminate',
  ],
  'toggle.binary': [
    'default',
    'hover',
    'active',
    'focused',
    'disabled',
    'checked',
    'pressed',
  ],
  'toggle.tristate': [
    'default',
    'hover',
    'active',
    'focused',
    'disabled',
    'checked',
    'indeterminate',
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
    evaluation?: Evaluation;
    /** User-facing consequence or risk profile. (FSL §6 — optional) */
    consequence?: Consequence;
  };
}[Entity];

/**
 * Validates a SemanticExpression against the legality matrices.
 * Returns an array of error messages. Empty array means the expression is valid.
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

  return errors;
};
