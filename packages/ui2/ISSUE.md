# ui2 Architecture Evolution — Implementation Guide

> **Reference**: [PLANNING.md](./PLANNING.md) for architectural decisions and rationale.
> **Scope**: Restructure ui2 to derive all component contracts from a single classification (Responsibility + Host.Role), enabling AI to create components deterministically on first pass.

---

## Pre-flight Checklist

Before starting any block, ensure:

```bash
cd packages/ui2
pnpm run test                    # all 8 existing components pass
pnpm run build
```

Save these results. Every block must end with these same commands passing.

---

## Block 1: BehavioralClass — Type System + Data Layer

**Goal**: Add `BehavioralClass` type, mapping, and helper function. No CSS changes yet. No component changes yet. Pure additive.

### 1.1 Add types and mapping to `src/_model/index.ts`

After the `Responsibility` type definition, add:

```typescript
export type BehavioralClass = 'interactive' | 'formControl' | 'static';

export const BEHAVIORAL_CLASS: Record<Responsibility, BehavioralClass> = {
  Action:     'interactive',
  Input:      'formControl',
  Selection:  'formControl',
  Navigation: 'interactive',
  Disclosure: 'interactive',
  Collection: 'static',
  Overlay:    'interactive',
  Feedback:   'static',
  Structure:  'static',
};

export const resolveBehavioralClass = (r: Responsibility): BehavioralClass => {
  return BEHAVIORAL_CLASS[r];
};
```

Export `BehavioralClass`, `BEHAVIORAL_CLASS`, and `resolveBehavioralClass` from the module.

### 1.2 Create `src/_shared/behavioral.ts`

```typescript
import { BEHAVIORAL_CLASS, type Responsibility } from '../_model/index';

export const behavioralAttrs = (responsibility: Responsibility) => {
  const bc = BEHAVIORAL_CLASS[responsibility];
  return bc !== 'static'
    ? ({ 'data-ui2-behavioral': bc } as const)
    : ({} as const);
};
```

### 1.3 Verify

```bash
pnpm run test   # nothing changed, all pass
```

### Acceptance criteria
- [ ] `BehavioralClass` type exported from `@ttoss/ui2/model`
- [ ] `BEHAVIORAL_CLASS` mapping covers all 9 Responsibilities
- [ ] `resolveBehavioralClass()` returns correct class for each Responsibility
- [ ] `behavioralAttrs()` returns `data-ui2-behavioral` for non-static, empty object for static
- [ ] All existing tests pass unchanged

---

## Block 2: Behavioral CSS Layer

**Goal**: Create the universal CSS layer. Import it. No component changes yet — the layer exists but no element has `data-ui2-behavioral` yet, so nothing visual changes.

### 2.1 Create `src/styles/behavioral.css`

```css
/* ===========================================================================
 * Behavioral CSS Layer — Universal token contracts
 *
 * Applied via [data-ui2-behavioral] attribute on the interactive element.
 * Only truly universal behaviors live here:
 *   - :disabled / [data-disabled] opacity
 *   - :focus-visible / [data-focus-visible] outline (focus ring)
 *
 * NOT here (identity-specific, stays in component CSS):
 *   - Hover effects (vary by component: opacity, background, or color)
 *   - Input borders (tied to specific color token prefix)
 * =========================================================================== */

@layer ui2.behavioral {
  [data-ui2-behavioral='interactive'][data-disabled],
  [data-ui2-behavioral='interactive']:disabled,
  [data-ui2-behavioral='formControl'][data-disabled],
  [data-ui2-behavioral='formControl']:disabled {
    opacity: var(--tt-opacity-feedback-disabled-element);
    cursor: not-allowed;
    pointer-events: none;
  }

  [data-ui2-behavioral='interactive'][data-focus-visible],
  [data-ui2-behavioral='interactive']:focus-visible,
  [data-ui2-behavioral='formControl'][data-focus-visible],
  [data-ui2-behavioral='formControl']:focus-visible {
    outline: 2px solid var(--tt-action-primary-background-default);
    outline-offset: 2px;
  }
}
```

### 2.2 Import in `src/styles.css`

Add as the **first** import (before component styles):

```css
/* Behavioral layer (universal contracts — must come before component styles) */
@import './styles/behavioral.css';
```

### 2.3 Verify

```bash
pnpm run test   # still pass — no element has the attribute yet
```

### Acceptance criteria
- [ ] `behavioral.css` exists with disabled + focus rules only
- [ ] `styles.css` imports it before all component CSS
- [ ] All existing tests pass unchanged
- [ ] No visual change in any component (attribute not applied yet)

---

## Block 3: Apply behavioral attributes + Remove duplicated CSS — Component by Component

**Goal**: For each component, add `behavioralAttrs()` on the correct interactive element, then remove the now-redundant disabled/focus CSS rules. One component at a time, test after each.

**Critical rule**: `data-ui2-behavioral` goes on the **element that receives focus and user gestures**. For simple components this is the root. For composites this is the interactive sub-part.

### 3.1 Button

**`.tsx`**: Add `{...behavioralAttrs('Action')}` to the `<button>` element.

**`.css`**: Remove:
- `.ui2-button:disabled { opacity: ...; cursor: ...; }` — handled by behavioral layer
- `.ui2-button:focus-visible { outline: ...; }` — handled by behavioral layer

**Keep**: All hover rules (`:hover` opacity and background-color vary by variant — identity concern).

```bash
pnpm run test
```

### 3.2 Checkbox

**`.tsx`**: Add `{...behavioralAttrs('Selection')}` to the `<Checkbox.Control>` element (the `__control` sub-part, NOT the root).

**`.css`**: Remove:
- `.ui2-checkbox[data-disabled] { opacity: ...; cursor: ...; }` — behavioral layer handles via `__control`
- `.ui2-checkbox__control[data-focus-visible] { outline: ...; }` — behavioral layer handles

**Keep**: All hover, border, and checked/indeterminate state rules.

```bash
pnpm run test
```

### 3.3 Switch

**`.tsx`**: Add `{...behavioralAttrs('Selection')}` to `<Switch.Control>`.

**`.css`**: Remove:
- `.ui2-switch[data-disabled] { opacity: ...; cursor: ...; }` — behavioral layer
- `.ui2-switch__control[data-focus-visible] { outline: ...; }` — behavioral layer

**Keep**: All hover, border, and checked state rules.

```bash
pnpm run test
```

### 3.4 Tooltip

**`.tsx`**: Tooltip is `Overlay` → `interactive`. But the trigger is passed by the consumer, not owned by ui2. The content is not interactive. **Do NOT add `behavioralAttrs` to Tooltip** — it doesn't have an owned interactive element.

**`.css`**: No behavioral rules to remove (Tooltip has no disabled/focus rules).

```bash
pnpm run test
```

### 3.5 Accordion

**`.tsx`**: Add `{...behavioralAttrs('Disclosure')}` to `<Accordion.ItemTrigger>` (the `__trigger` sub-part).

**`.css`**: Remove:
- `.ui2-accordion__trigger[data-disabled] { opacity: ...; cursor: ...; }` — behavioral layer
- `.ui2-accordion__trigger:focus-visible { outline: ...; }` — behavioral layer

**Keep**: Hover background-color change on trigger (identity concern).

```bash
pnpm run test
```

### 3.6 Dialog

**`.tsx`**: Add `{...behavioralAttrs('Action')}` to `<Dialog.CloseTrigger>` (its Responsibility within the composite is Action).

**`.css`**: Remove:
- `.ui2-dialog__close-trigger:focus-visible { outline: ...; }` — behavioral layer

**Keep**: Hover on close-trigger (background-color change — identity). Dialog content has no disable/focus behavioral rules.

```bash
pnpm run test
```

### 3.7 Tabs

**`.tsx`**: Add `{...behavioralAttrs('Navigation')}` to each `<Tabs.Trigger>` (the `__trigger` sub-part).

**`.css`**: Remove:
- `.ui2-tabs__trigger[data-disabled] { opacity: ...; cursor: ...; }` — behavioral layer
- `.ui2-tabs__trigger:focus-visible { outline: ...; }` — behavioral layer

**Keep**: Hover color change on trigger (identity concern).

```bash
pnpm run test
```

### 3.8 Field

**`.tsx`**: Add `{...behavioralAttrs('Input')}` to `<Field.Input>` and `<Field.Textarea>` elements (the `__input` / `__textarea` sub-parts). These are the form controls.

**`.css`**: Remove:
- `.ui2-field__input:disabled { opacity: ...; cursor: ...; }` — behavioral layer

**Keep**: Focus ring on `__input` uses `border-color` + `box-shadow` (not `outline`) — this is identity-specific (form control visual feedback), keep it. Input border stays (identity).

```bash
pnpm run test
```

### 3.9 Final verification

```bash
cd packages/ui2
pnpm run test
cd ../..
pnpm turbo run test --filter=...@ttoss/ui2
pnpm turbo run build --filter=...@ttoss/ui2
```

### Acceptance criteria
- [ ] Every interactive element in every component has `data-ui2-behavioral` attribute
- [ ] No component CSS has duplicated disabled/focus rules that the behavioral layer handles
- [ ] Hover behavior preserved per-component (identity concern)
- [ ] All tests pass
- [ ] All dependent packages build

---

## Block 4: Derive Token Namespaces — Remove Manual `tokens` Field

**Goal**: Replace manual `tokens` arrays in `ComponentContract` with a derived function.

### 4.1 Create `deriveTokenNamespaces()` in `src/_model/tokenDerivation.ts`

```typescript
import type { Host } from './composition';
import { hostRoles } from './composition';
import type { Responsibility, TokenNamespace } from './index';
import { compositionTokens, resolveTokens } from './tokenResolution';

export const deriveTokenNamespaces = ({
  responsibility,
  host,
}: {
  responsibility: Responsibility;
  host?: Host;
}): Set<TokenNamespace> => {
  const spec = resolveTokens({ responsibility });
  const namespaces = new Set<TokenNamespace>();

  if (spec.color) {
    namespaces.add(spec.color.split('.')[0] as TokenNamespace);
  }
  if (spec.spacing) namespaces.add('spacing');
  if (spec.radii) namespaces.add('radii');
  if (spec.elevation) namespaces.add('elevation');

  if (host) {
    const roles = hostRoles[host];
    for (const role of roles) {
      const key = `${host}.${role}`;
      const override = compositionTokens[key];
      if (override?.color) {
        namespaces.add(override.color.split('.')[0] as TokenNamespace);
      }
      if (override?.radii) namespaces.add('radii');
      if (override?.elevation) namespaces.add('elevation');
      if (override?.spacing) namespaces.add('spacing');
    }
  }

  return namespaces;
};
```

Export from `_model/index.ts`.

### 4.2 Validate derivation matches manual lists

**Before** removing `tokens`, write a temporary test that asserts for every existing `componentContracts` entry:

```typescript
test.each(componentContracts)('$name: derived namespaces cover manual tokens', (contract) => {
  const derived = deriveTokenNamespaces({
    responsibility: contract.responsibility,
    host: contract.host,
  });
  for (const ns of contract.tokens) {
    expect(derived.has(ns)).toBe(true);
  }
});
```

Run it. If any fail, the derivation function needs adjustment (the manual list may include extra namespaces used by variants — handle those).

### 4.3 Remove `tokens` from `ComponentContract`

Once the derivation test passes:
1. Remove `tokens` field from `ComponentContract` interface
2. Remove `tokens` array from every entry in `componentContracts`
3. Remove `TokenNamespace` type from exports (or keep for test use only)

### 4.4 Update test P6

Replace `contract.tokens` with `deriveTokenNamespaces(contract)`:

```typescript
test('only uses --tt-* namespaces allowed by its classification', () => {
  const allowed = deriveTokenNamespaces({
    responsibility: contract.responsibility,
    host: contract.host,
  });
  // ... same validation logic, using derived `allowed` set
});
```

### 4.5 Verify

```bash
pnpm run test
pnpm turbo run test --filter=...@ttoss/ui2
```

### Acceptance criteria
- [ ] `deriveTokenNamespaces()` produces correct namespaces for all 8 existing components
- [ ] `tokens` field removed from `ComponentContract` and all entries
- [ ] Test P6 uses derived namespaces
- [ ] All tests pass

---

## Block 5: Merge Registries — Single Registration Point

**Goal**: Reduce component registration from 2 files to 1.

### 5.1 Refactor `componentRegistry.tsx` to extend `componentContracts`

```typescript
// tests/unit/tests/componentRegistry.tsx
import { componentContracts, type ComponentContract } from 'src/_model/index';
import { Button, Checkbox, ... } from 'src/index';

interface TestExtension {
  render: () => React.ReactElement;
  expectedClasses: string[];
  classNameTargets: ClassNameTarget[];
  compositionScopes?: CompositionScope[];
}

type FullEntry = ComponentContract & TestExtension;

const testExtensions: Record<string, TestExtension> = {
  Button: {
    render: () => <Button>Click</Button>,
    expectedClasses: ['ui2-button'],
    classNameTargets: [/* ... */],
  },
  // ... one per component
};

export const componentRegistry: FullEntry[] = componentContracts.map((c) => {
  const ext = testExtensions[c.name];
  if (!ext) {
    throw new Error(`Missing test extension for component: ${c.name}`);
  }
  return { ...c, ...ext };
});
```

### 5.2 Add test: every contract has a test extension

```typescript
test('every componentContract has a test extension', () => {
  for (const c of componentContracts) {
    expect(testExtensions[c.name]).toBeDefined();
  }
});
```

This catches any component added to `componentContracts` without a corresponding test render.

### 5.3 Verify

```bash
pnpm run test
```

### Acceptance criteria
- [ ] `componentRegistry` derives from `componentContracts` — no duplicated metadata
- [ ] Adding a new component = 1 entry in `componentContracts` + 1 entry in `testExtensions`
- [ ] Missing test extension throws immediately
- [ ] All tests pass

---

## Block 6: Remove `responsibilityDefaults.json`

**Goal**: Eliminate redundant data source.

### 6.1 Delete `src/_model/responsibilityDefaults.json`

The data is already inlined as the `responsibilityDefaults` const in `tokenResolution.ts`. The JSON file is not imported anywhere (the `tokenResolution.ts` const is the actual source of truth). Remove the file.

### 6.2 Verify no imports reference it

```bash
grep -r "responsibilityDefaults.json" packages/ui2/
```

If any imports exist, update them to use the TypeScript const.

### 6.3 Verify

```bash
pnpm run test
```

### Acceptance criteria
- [ ] `responsibilityDefaults.json` deleted
- [ ] No import references the JSON file
- [ ] All tests pass

---

## Block 7: Rewrite `CONVENTIONS.md`

**Goal**: Update the AI-facing guide to reflect the simplified workflow.

### 7.1 Rewrite with 4-step workflow

Replace the current 8-step guide with:

```markdown
## How to create a new component

### 1. Classify
- Determine the **Responsibility** (which of the 9 categories?)
- If multi-part compound UI: determine the **Host** (which compositional structure?)
- Query tokens: `resolveTokens({ responsibility: 'X' })` → exact token paths
- Check behavioral class: `resolveBehavioralClass('X')` → 'interactive' | 'formControl' | 'static'

### 2. Create files
- Simple primitive → `src/components/{slug}/{slug}.tsx` + `{slug}.css`
- Compound → `src/composites/{slug}/{slug}.tsx` + `{slug}.css`

### 3. Write code

**TSX**:
- Wrap Ark UI primitive
- Use BEM classes: `ui2-{slug}` root, `ui2-{slug}__{element}` sub-parts
- Apply `behavioralAttrs(responsibility)` on the interactive element
- Forward `className` and `ref`

**CSS**:
- Use `colorVar()`, `textStyleVars()`, `spacingVar()` to get exact --tt-* var names
- Write ONLY identity tokens — no :disabled opacity, no :focus-visible outline
- Hover behavior is identity-specific (write it per-variant)
- Add CSS header comment with Responsibility + resolved TokenSpec

### 4. Register
- Add entry to `componentContracts` in `_model/index.ts`
- Add test extension to `testExtensions` in `componentRegistry.tsx`
- Export from `src/index.ts`
- Import CSS in `src/styles.css`
- Contract tests validate automatically
```

### 7.2 Update token grammar table, composition examples

Keep the existing reference tables but ensure they match current state.

### 7.3 Verify

Read the entire CONVENTIONS.md. Ensure no reference to removed concepts (manual `tokens` field, 8-step workflow). Ensure all code examples compile mentally against current types.

### Acceptance criteria
- [ ] 4-step workflow documented
- [ ] `behavioralAttrs()` usage documented with placement rule (interactive element, not root)
- [ ] "DO NOT" list for behavioral CSS clearly stated
- [ ] Token grammar table accurate
- [ ] Composition examples accurate

---

## Block 8: Enhanced CSS Var Validation (P7)

**Goal**: Catch semantic token role-level renames (e.g. `primary` → `main`) in CSS files.

### 8.1 Add test P7 to `componentContracts.test.tsx`

For each component, resolve its full `TokenSpec` (including composition overrides), generate the expected CSS var prefixes, and validate that the component's CSS file only uses vars matching those prefixes.

```typescript
// P7: CSS var path validation (catches role-level renames)
describe.each(componentContracts)('$name — CSS var paths', (contract) => {
  test('CSS vars match resolved TokenSpec paths', () => {
    // 1. Collect all valid color prefixes from responsibility + all composition roles
    const validPrefixes = new Set<string>();

    const baseSpec = resolveTokens({ responsibility: contract.responsibility });
    if (baseSpec.color) {
      validPrefixes.add(`--tt-${baseSpec.color.replace(/\./g, '-')}`);
    }

    if (contract.host) {
      for (const role of hostRoles[contract.host]) {
        const roleSpec = resolveTokens({
          responsibility: contract.responsibility,
          host: contract.host,
          role,
        });
        if (roleSpec.color) {
          validPrefixes.add(`--tt-${roleSpec.color.replace(/\./g, '-')}`);
        }
      }
    }

    // 2. Extract --tt-{ux}-{role} prefixes from CSS
    const css = readCssFile(contract);
    const colorVars = extractTokenVars(css).filter(v => {
      const seg = v.replace('--tt-', '').split('-')[0];
      return ['action', 'input', 'content', 'feedback', 'navigation'].includes(seg);
    });

    // 3. Each color var must start with one of the valid prefixes
    const violations = colorVars.filter(v => {
      return ![...validPrefixes].some(p => v.startsWith(p));
    });

    expect(violations).toEqual([]);
  });
});
```

### 8.2 Verify

```bash
pnpm run test   # P7 should pass for all existing components
```

### Acceptance criteria
- [ ] P7 test validates CSS var paths against resolved TokenSpec
- [ ] All 8 existing components pass P7
- [ ] Renaming a semantic token role in theme-v2 would cause P7 failures in affected CSS files

---

## Block 9: Final Validation + Cleanup

### 9.1 Full test suite

```bash
cd packages/ui2
pnpm run test

cd ../..
pnpm turbo run test --filter=...@ttoss/ui2
pnpm turbo run build --filter=...@ttoss/ui2
pnpm run -w lint
```

### 9.2 Update `UI2.md`

Add `BehavioralClass` to the architecture section. Update the comparison table to note behavioral CSS layer. Update the "Deterministic AI Workflow" diagram to include behavioral classification.

### 9.3 Update `README.md`

Ensure any public-facing documentation reflects the simplified component creation workflow.

### 9.4 Coverage threshold

Check test coverage output. Update `jest.config.ts` `coverageThreshold` values to match or exceed current coverage.

### Acceptance criteria
- [ ] All tests pass
- [ ] All dependent packages pass
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Coverage threshold updated
- [ ] `UI2.md` updated
- [ ] `README.md` updated

---

## Execution Summary

```
Block 1  BehavioralClass types + helper         Pure additive, zero risk
Block 2  behavioral.css layer                   Pure additive, zero risk
Block 3  Apply attrs + remove duplicated CSS    One component at a time, test after each
Block 4  Derive token namespaces                Replace manual tokens, test parity first
Block 5  Merge registries                       Organizational, test after
Block 6  Remove JSON file                       Cleanup, test after
Block 7  Rewrite CONVENTIONS.md                 Documentation
Block 8  P7 CSS var validation                  New test, additive
Block 9  Final validation + cleanup             Polish
```

**Dependencies**: Block 1 → Block 2 → Block 3 (sequential). Blocks 4 and 5 can run in parallel after Block 3. Block 6 is independent (can run anytime). Block 7 after Block 5. Block 8 after Block 4. Block 9 after all.

```
Block 1 → Block 2 → Block 3 → Block 4 ──→ Block 8 ──┐
                                  ↘                    ↓
                              Block 5 → Block 7 → Block 9
                                  ↗
                    Block 6 ─────┘
```

---

## Invariants — Must Be True At All Times

1. **Every interactive element has `data-ui2-behavioral`** (after Block 3)
2. **No component CSS duplicates behavioral layer rules** (after Block 3)
3. **Hover stays in component CSS** — never in behavioral layer
4. **`_model/` has no React imports** — framework-agnostic always
5. **`tokens` field is derived, not manual** (after Block 4)
6. **All contract tests pass after every block**
7. **Coverage never decreases**