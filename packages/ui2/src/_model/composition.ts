/**
 * Composition Model — Hosts, Roles, and the full composition vocabulary.
 *
 * This module formalizes the "Host.Role" dimension from the Component Model.
 * It is the compositional counterpart to Responsibility.
 *
 * - A Host is a compositional structure (e.g., ActionSet, FieldFrame)
 * - A Role is what an instance does inside that Host (e.g., primary, label)
 * - Host.Role refines the default token resolution provided by Responsibility
 */

/* ------------------------------------------------------------------ */
/*  Host                                                               */
/* ------------------------------------------------------------------ */

/**
 * A Host defines the compositional structure an instance participates in.
 *
 * - ActionSet:    groups of actions in the same surface
 * - FieldFrame:   fields and their supporting elements
 * - ItemFrame:    internal structure of items in collections
 * - SurfaceFrame: structured surfaces and their internal regions
 */
export type Host = 'ActionSet' | 'FieldFrame' | 'ItemFrame' | 'SurfaceFrame';

/* ------------------------------------------------------------------ */
/*  Roles per Host                                                     */
/* ------------------------------------------------------------------ */

export type ActionSetRole = 'primary' | 'secondary' | 'dismiss';

export type FieldFrameRole =
  | 'control'
  | 'label'
  | 'description'
  | 'leadingAdornment'
  | 'trailingAdornment'
  | 'validationMessage';

export type ItemFrameRole =
  | 'label'
  | 'description'
  | 'supportingVisual'
  | 'trailingMeta'
  | 'selectionControl';

export type SurfaceFrameRole =
  | 'media'
  | 'heading'
  | 'body'
  | 'actions'
  | 'status';

/**
 * Maps a Host to its valid Roles via conditional type.
 *
 * @example
 * type R = RoleOf<'ActionSet'>; // 'primary' | 'secondary' | 'dismiss'
 * type F = RoleOf<'FieldFrame'>; // 'control' | 'label' | 'description' | ...
 */
export type RoleOf<H extends Host> = H extends 'ActionSet'
  ? ActionSetRole
  : H extends 'FieldFrame'
    ? FieldFrameRole
    : H extends 'ItemFrame'
      ? ItemFrameRole
      : H extends 'SurfaceFrame'
        ? SurfaceFrameRole
        : never;

/* ------------------------------------------------------------------ */
/*  Host → Roles registry (runtime-iterable)                           */
/* ------------------------------------------------------------------ */

/**
 * All valid roles per host as a const record.
 * Useful for iteration, validation, and code generation.
 */
export const hostRoles = {
  ActionSet: ['primary', 'secondary', 'dismiss'],
  FieldFrame: [
    'control',
    'label',
    'description',
    'leadingAdornment',
    'trailingAdornment',
    'validationMessage',
  ],
  ItemFrame: [
    'label',
    'description',
    'supportingVisual',
    'trailingMeta',
    'selectionControl',
  ],
  SurfaceFrame: ['media', 'heading', 'body', 'actions', 'status'],
} as const satisfies Record<Host, readonly string[]>;
