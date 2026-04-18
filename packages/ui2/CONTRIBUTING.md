# Contributing to `@ttoss/ui2`

Three source-of-truth documents drive all work in this package. Read them in this order:

1. **`src/semantics/taxonomy.ts`** — Layer 1. The FSL vocabulary (Entities, Structures, Interactions, Evaluations, Compositions, States) and the legality matrices that constrain their combinations. Zero imports.
2. **`src/tokens/CONTRACT.md`** — Layer 2. Given an `Entity`, tells you which `vars.*` paths to use, how to wire state, and how to apply `data-*` attributes. This is the authoring guide for humans **and** AI agents.
3. **`tests/unit/tests/components.contract.test.tsx`** — enforcement. Auto-discovers every `*Meta` export and validates it against the taxonomy + token hygiene rules.

> There is intentionally no `resolveTokens()` function or runtime token resolver.
> Components read `CONTRACT.md §1` and consume `vars.*` directly. This will be
> reconsidered only after the catalog stabilizes with many components and composites.

---

## Adding a new component

1. Write `fooMeta` with `as const satisfies ComponentMeta<E>`. Pick `entity`, `structure`, optional `interaction` / `composition`.
2. Read `CONTRACT.md §1` row for your entity. Use only tokens from that row.
3. Follow `CONTRACT.md §3` for state cascade (`disabled > focusVisible > pressed > hovered > default`).
4. Emit `data-scope` / `data-part` / `data-evaluation` per `CONTRACT.md §5`.
5. Export both `Foo` and `fooMeta` from `src/index.ts`. Contract tests auto-discover.

`CONTRACT.md §7` contains a full Button example to copy from.

---

## Editing `src/semantics/`

### Adding a term to an existing dimension

Add the string to the `as const` array, then add it to every relevant matrix row. `pnpm run test` catches inconsistencies (unknown term, duplicate, missing matrix row).

### Adding a new Entity

Three additions — or it won't compile:

```typescript
export const ENTITIES = [..., 'MyEntity'] as const;

// ENTITY_STRUCTURE and ENTITY_INTERACTION are Record<Entity, ...>
// — omitting your new Entity is a compile error.
export const ENTITY_STRUCTURE = { ..., MyEntity: ['root', ...] };
export const ENTITY_INTERACTION = { ..., MyEntity: [] }; // empty if none
```

Then add the `CONTRACT.md §1` row for the new entity.

### Adding a new InteractionKind

Requires a row in `INTERACTION_STATE` — `Record<InteractionKind, ...>` enforces it:

```typescript
export const INTERACTION_STATE = { ..., 'my.kind': ['default', 'hover', 'focused', 'disabled'] };
```

### Adding a field to `SemanticExpression`

Answer these first:

1. Is it Layer 1? If it only matters for token selection or React rendering (`isDisabled`), it belongs elsewhere.
2. Does `validateExpression()` need a rule for it? Add one only if an illegal value would produce an undetectable downstream error.

### Adding a rule to `validateExpression()`

Returns `string[]` — empty = valid. Rules must cross-reference two dimensions using a matrix from `taxonomy.ts`, produce actionable messages (name the illegal value + what is legal), and never throw.

---

## Non-obvious trade-offs

**`SemanticExpression` omits `consequence`, `layer`, and `context`.**
These FSL dimensions are deferred — see the `FSL Dimension Coverage` table in `taxonomy.ts`. Add them when a concrete prototype exercises the semantics, not before.

**`INTERACTION_STATE` is not validated in `validateExpression()`.**
States are resolved at runtime by React Aria via render props — a component never declares its states. The matrix exists for documentation and downstream tooling (Storybook, AI), not static validation.

---

## Hard rules

- `taxonomy.ts` imports nothing. Any `import` in that file is wrong.
- Types derive from arrays via `typeof … [number]` — never a standalone union.
- `validateExpression()` never throws.
- No color roles, `vars`, or CSS concepts enter `src/semantics/`.
- Components consume only semantic tokens (`vars.*`). No hex/rgb literals, no `var(--x, fallback)`. Contract tests enforce.
