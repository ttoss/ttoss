---
title: Component Model
---

# Component Model

The Component Model is the **Component Semantics Projection** — [layer 3 of the FSL architecture](/docs/design/design-system/fsl/). It derives from the [FSL Lexicon](/docs/design/design-system/fsl/fsl-lexicon) and [FSL Structural Language](/docs/design/design-system/fsl/fsl-structural-language) and must not define vocabulary that contradicts them.

:::info Status: implemented in `@ttoss/fsl-ui`
This document is the design specification for the Component Semantics Projection, now **implemented** by `@ttoss/fsl-ui`: `taxonomy.ts` (vocabulary + legality matrices), `ComponentMeta`, `ENTITY_COMPOSITION` / `ENTITY_STRUCTURE` / `ENTITY_TOKEN_MAPPING` (`packages/fsl-ui/src/tokens/projection.ts`), and contract tests that auto-validate every component against the matrices. The [Semantic Token Projection](/docs/design/design-system/design-tokens/model) (layer 4, `@ttoss/fsl-theme`) is also implemented. The **Deterministic Resolver** (layer 5) remains planned. Where this document and the shipped code diverge, the code + its contract tests are the source of truth.
:::

The central rule:

> **A component has an immutable identity. An instance carries that identity into a composition.**

## FSL dimension mapping

The model adopts FSL dimension names directly (no projection renames; FSL §17.1 permits renames but this profile keeps the foundation vocabulary):

| FSL dimension    | Model name      | Notes                                                                                                                                                                                                                                                                                                                                          |
| :--------------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity Kind      | **Entity**      | Values identical; field name is `entity` in `ComponentMeta` and all `*Meta` declarations                                                                                                                                                                                                                                                       |
| Structural Role  | **Structure**   | Root structural role of the component (e.g. `root`); legal values constrained per Entity via `ENTITY_STRUCTURE`                                                                                                                                                                                                                                |
| Composition Role | **Composition** | Flat vocabulary; Lexicon §4 values plus three declared profile extensions (`step`, `summary`, `navigation`). Per-Entity legality via `ENTITY_COMPOSITION` in `taxonomy.ts`.                                                                                                                                                                    |
| Interaction Kind | —               | **Deferred** per FSL §13.3 — not codified in this profile. See `taxonomy.ts` §Dimension Coverage for rationale and readmission criterion.                                                                                                                                                                                                      |
| Evaluation       | **Evaluation**  | Values identical                                                                                                                                                                                                                                                                                                                               |
| Consequence      | **Consequence** | Profile-narrowed subset — `neutral`, `committing`, `destructive` only (`CONSEQUENCES` in `taxonomy.ts`); the remaining [Lexicon §6](/docs/design/design-system/fsl/fsl-lexicon#6-consequence) values are rejected with recorded rationale (see [Consequence](#consequence) below)                                                              |
| State            | **State**       | Values identical; runtime-resolved by React Aria render props, not authorially declared                                                                                                                                                                                                                                                        |
| Layer Role       | —               | **Absorbed** per FSL §13.3 — captured by the token projection's `surfaceType` (`control`/`surface`), the elevation strata (`flat`/`raised`/`overlay`/`blocking`), and the z-index layer scale (`base`/`sticky`/`overlay`/`blocking`/`transient`), which jointly recover all six Lexicon §8 layer roles. See `taxonomy.ts` §Dimension Coverage. |
| Context Class    | —               | **Deferred** per FSL §13.3 — refinement dimension (density, mode, a11y preferences) with no prototype exercising it. Readmission criterion: mode switching validated end-to-end via `@ttoss/fsl-theme`. See `taxonomy.ts` §Dimension Coverage.                                                                                                 |

## Entity → Token UX context mapping

The normative Entity → `ux` context mapping lives in `ENTITY_TOKEN_MAPPING`
in `packages/fsl-ui/src/tokens/projection.ts` — the single source of truth,
enforced by contract tests. The table below mirrors it for reading; on any
divergence, the code wins.

| Entity         | Token `ux` context | Notes                                                                             |
| :------------- | :----------------- | :-------------------------------------------------------------------------------- |
| **Action**     | `action`           | 1:1                                                                               |
| **Input**      | `input`            | 1:1                                                                               |
| **Selection**  | `input`            | Selection components consume `input.*` tokens; no separate `selection` UX context |
| **Navigation** | `navigation`       | 1:1                                                                               |
| **Feedback**   | `feedback`         | 1:1                                                                               |
| **Collection** | `informational`    | Collection surfaces consume `informational.*` for structural coloring             |
| **Overlay**    | `informational`    | Overlay surfaces consume `informational.*` for surface coloring                   |
| **Disclosure** | `navigation`       | Disclosure triggers colored as `navigation.*` when acting as location anchors     |
| **Structure**  | `informational`    | Structural surfaces consume `informational.*`                                     |

For the full `ux` role and state grammar, see the [Colors family — FSL Entity Kind Mapping](/docs/design/design-system/design-tokens/families/colors#fsl-entity-kind-mapping).

## ComponentExpression

The model is expressed as a `ComponentExpression` — the typed semantic expression that the resolver consumes:

```ts
type ComponentExpression = {
  entity: Entity; // required — what the component IS
  structure: StructuralRole; // required — root structural role (e.g. 'root'); legality per Entity via ENTITY_STRUCTURE
  composition?: CompositionRole; // optional — flat slot name (FSL Lexicon §4)
  evaluation?: Evaluation; // optional — emphatic meaning
  consequence?: Consequence; // optional — risk profile
};
```

All dimensions are defined in `taxonomy.ts` and derived from FSL core vocabulary.

> **Code type:** the implementation exposes `ComponentMeta<E>` (`packages/fsl-ui/src/semantics/componentMeta.ts`) — the identity type every component declares (`entity`, `structure`, `composition?`, `consequence?`). `ComponentExpression` above is the projection's conceptual shape; `ComponentMeta` is its shipped runtime surface.

---

## Entity

Entity answers: _What is this component?_

Every component has exactly one Entity. It cannot change based on context, variant, or usage. If a different Entity is required, a different component must exist.

| Entity         | Use for                                             | Typical examples                      |
| :------------- | :-------------------------------------------------- | :------------------------------------ |
| **Action**     | triggering actions or commands                      | button, action button, icon button    |
| **Input**      | direct user input                                   | text field, text area, search field   |
| **Selection**  | choosing one or more options                        | checkbox, radio group, select, picker |
| **Collection** | structured sets of items                            | menu, list, table, tree, grid         |
| **Navigation** | movement across destinations or views               | link, breadcrumbs, tabs, nav item     |
| **Disclosure** | revealing or hiding related content in place        | accordion, disclosure trigger         |
| **Overlay**    | temporary layered UI above the interface            | dialog, popover, tooltip, drawer      |
| **Feedback**   | communicating state, status, or outcome             | alert, banner, toast, progress        |
| **Structure**  | organizing interface structure and support surfaces | panel, section, shell, frame          |

---

## Composition Model

Composition answers: _What slot does this instance occupy inside a larger composite?_

Composition is a **flat vocabulary** per FSL Lexicon §4 and FSL §5.4. A composition role names the slot; legality is per Entity (not per parent component). When omitted, the component resolves tokens from its Entity default. The vocabulary is the Lexicon §4 set **plus three profile extensions** (`step`, `summary`, `navigation` — Structure-only slots), declared per FSL §17's extension model.

Case discipline: the `navigation` slot (lowercase, Composition) is distinct from the `Navigation` Entity Kind — the same convention the Lexicon applies to `Structure`/`structure` (§10.12) and `Overlay`/`overlay` (§10.13). The slot names a position inside a structural composite; the Entity names what a component is.

### Composition roles

The projection codifies 14 composition roles. The table shows each role's meaning and which Entities may carry it (source of truth: `ENTITY_COMPOSITION` in `taxonomy.ts`).

| Role                | Meaning                                                | Legal Entities              |
| :------------------ | :----------------------------------------------------- | :-------------------------- |
| **primaryAction**   | main forward / commit action in a composite            | Action                      |
| **secondaryAction** | subordinate but intentional action                     | Action                      |
| **dismissAction**   | cancel / close without committing                      | Action                      |
| **heading**         | compositional heading slot                             | Overlay, Structure          |
| **body**            | compositional body slot                                | Overlay, Structure          |
| **status**          | compositional status / validation slot                 | Input, Feedback             |
| **control**         | primary control-bearing slot                           | Input, Selection            |
| **label**           | naming / label slot                                    | Input, Selection, Structure |
| **description**     | descriptive / helper-text slot                         | Input, Selection, Structure |
| **supporting**      | supporting child slot (broader than label/description) | Input, Structure            |
| **selection**       | selection-bearing slot                                 | Selection                   |
| **step**            | step slot (e.g. progression marker)                    | Structure                   |
| **summary**         | summary slot                                           | Structure                   |
| **navigation**      | navigation slot inside a structural composite          | Structure                   |

### Parent disambiguation

Because the vocabulary is flat, the same role name may appear in multiple composites — for example, a `label` slot exists on both TextField (Input) and a Structure composite. Runtime and CSS disambiguation comes from the rendered DOM, not from adding a `host` level to the data model:

- `data-scope` + `data-part` on the composite container identify the parent (e.g. `data-scope="dialog" data-part="actions"` on `DialogActions`).
- `data-composition` on the slot-bearing child carries the role name.

Example selector: `[data-scope="dialog"][data-part="actions"] [data-composition="primaryAction"]` resolves a dialog's primary action unambiguously, without a `host` level.

---

## Evaluation

Evaluation answers: _What emphatic or evaluative meaning does this expression carry?_

Evaluation is optional. When omitted, each component applies its own documented default today; inference from Entity and composition context is the job of the **planned** Deterministic Resolver (layer 5). Add it explicitly only when the default is wrong.

Legality is per Entity (source of truth: `ENTITY_EVALUATION` in `taxonomy.ts`), same as the Composition table:

| Value         | Use for                              | Legal Entities                                                           |
| :------------ | :----------------------------------- | :----------------------------------------------------------------------- |
| **primary**   | main intended emphasis               | Action, Collection, Overlay, Navigation, Disclosure, Feedback, Structure |
| **secondary** | subordinate but still intentional    | Action, Overlay, Navigation                                              |
| **accent**    | deliberately differentiated emphasis | Action, Overlay, Navigation, Feedback                                    |
| **muted**     | de-emphasized but still meaningful   | Action, Collection, Overlay, Navigation, Disclosure, Structure           |
| **positive**  | affirming, successful, or favorable  | Feedback                                                                 |
| **caution**   | warning or careful-attention signal  | Feedback                                                                 |
| **negative**  | harmful, erroneous, or adverse       | Action, Overlay, Feedback                                                |

`Input` and `Selection` carry **no** evaluations: form controls are data-entry surfaces, not decision hierarchies, and validation is the runtime `invalid` State (`isInvalid`), never `evaluation: 'negative'` — see the design note on `ENTITY_EVALUATION` in `taxonomy.ts`.

---

## Consequence

Consequence answers: _What user-facing consequence or risk profile does this carry?_

Consequence is optional. When omitted, `neutral` is implied. Distinct from Evaluation: `negative` is evaluative meaning; `destructive` is outcome risk — both may appear simultaneously.

The profile codifies three values (`CONSEQUENCES` in `taxonomy.ts`) — a deliberate narrowing of the [Lexicon §6](/docs/design/design-system/fsl/fsl-lexicon#6-consequence) vocabulary, declared per FSL §13.3. The remaining Lexicon terms are rejected with the following rationale:

- **reversible** is the logical complement of `committing`; carrying both doubles the vocabulary without adding an expressible distinction.
- **interruptive** is absorbed by the Entity `Overlay` — an Overlay is interruptive by kind, and non-overlay interruption has no component prototype to justify separate vocabulary.
- **recoverable** describes a runtime outcome of failure, not an authorial meta; recovery support belongs in component API (e.g. an `onRetry` prop), not in `ComponentMeta`.
- **safeDefaultRequired** is a derived policy: `destructive` already implies the need for a safe default, so codifying the policy separately would create a second source of truth for the same constraint.

The rejections are invariants of this profile, not of FSL — a different profile may codify more of the vocabulary if its component prototypes create new distinctions.

| Value           | Use for                                    |
| :-------------- | :----------------------------------------- |
| **neutral**     | no special risk profile                    |
| **committing**  | moves to a more committed state            |
| **destructive** | causes deletion or materially harmful loss |

Only `Action` carries consequence — every other entity's legal set in `ENTITY_CONSEQUENCE` is empty.

---

## Interaction

`Interaction Kind` is a FSL foundational dimension ([FSL Lexicon §3](/docs/design/design-system/fsl/fsl-lexicon#3-interaction-kind), [FSL §5.3](/docs/design/design-system/fsl/fsl-structural-language)) that this profile does **not** currently codify. The disposition is **Deferred** per [FSL §13.3](/docs/design/design-system/fsl/fsl-structural-language).

Readmission requires a component that dispatches behaviour on `Interaction Kind` at runtime — for example, a Wizard that progresses on `navigate.step` versus a Link that follows `navigate.link`. Until such a prototype exists, the dimension carries no expressible distinction in `ComponentMeta`. See `taxonomy.ts` §Dimension Coverage for the full rationale.

---

## State

State answers: _What interactional or semantic condition is currently active?_

State is not a prop passed at the expression level — it is runtime-resolved by React Aria render props (`isHovered`, `isFocused`, `isPressed`, `isSelected`, …) and surfaced as the CSS selector layer:

| State             | Meaning                                                                                    |
| :---------------- | :----------------------------------------------------------------------------------------- |
| **default**       | No special condition active                                                                |
| **hover**         | Pointer is over the element                                                                |
| **active**        | Element is being activated / pressed                                                       |
| **focused**       | Element has keyboard focus                                                                 |
| **disabled**      | Element is not interactive                                                                 |
| **selected**      | Item is selected within a collection                                                       |
| **pressed**       | Toggle is in its on-press state                                                            |
| **checked**       | Checkbox-like element is checked                                                           |
| **indeterminate** | Mixed or partial selection state                                                           |
| **expanded**      | Disclosure or select is open                                                               |
| **current**       | Navigation item matches the current location                                               |
| **visited**       | Link has been previously visited                                                           |
| **droptarget**    | Element is a valid target for a drag operation                                             |
| **invalid**       | Control's value failed validation (runtime — `isInvalid`, never authorial; Lexicon §10.15) |

Not all states are meaningful for every Entity — `checked` is only surfaced by selection components; `visited` only by navigation links. Legality here is React Aria's runtime concern (it only emits the render-prop for applicable primitives), not a build-time matrix — the declared legality source per FSL Structural Language §10.1 is **runtime resolution**.

### Concurrent states and resolution order

React Aria may report several state flags simultaneously (an item can be selected, focused, and hovered at once). The profile resolves them through `STATE_PRIORITY` (`taxonomy.ts`) — a declared, deterministic total order, as FSL Structural Language §11.4 requires. Two of its resolutions are deliberately **lossy**: `isSelected` resolves to `checked` and `isPressed` to `active`. Together with `visited` and `droptarget` (which have no render-prop flag in the cascade), this means `selected`, `pressed`, `visited`, and `droptarget` are never produced as resolved token states, even though they exist in the vocabulary. Per §11.4 this collapse is recorded here rather than silent. Readmission criterion: a component whose selected treatment must diverge from checked (or pressed from active) at the token level.

---

## How to use the model

#### 1. Set Entity

Classify the component itself.

- `Button` → `Action`
- `SearchField` → `Input`
- `Menu` → `Collection`
- `Dialog` → `Overlay`

#### 2. Add Composition when the instance occupies a slot in a composite

- `Button` in a dialog footer → `composition: 'primaryAction'`
- `Button` as a form submit → `composition: 'primaryAction'`
- TextField validation message → `composition: 'status'`
- Checkbox inside a RadioGroup-like set → `composition: 'selection'`

Legal values depend on the component's Entity — see the Composition roles table above.

#### 3. Add Evaluation when the default inference isn't right

Most expressions don't need explicit Evaluation. Add it when the standard inference is wrong:

- Destructive confirm button → `evaluation: 'negative'`
- Success state feedback → `evaluation: 'positive'`
- Subdued ghost action → `evaluation: 'muted'`

#### 4. Add Consequence when the interaction carries a material risk profile

- Delete / irreversible action → `consequence: 'destructive'`
- Save with no undo → `consequence: 'committing'`

---

## Usage Examples

> Token paths reference the **Semantic Token Projection** (layer 4) and are confirmed against the shipped `@ttoss/fsl-theme`.

#### Dialog footer buttons

```ts
// Save
{ entity: 'Action', composition: 'primaryAction' }
// → action.primary.background.default, action.primary.text.default

// Back to editing
{ entity: 'Action', composition: 'secondaryAction' }
// → action.secondary.background.default, action.secondary.text.default

// Cancel
{ entity: 'Action', composition: 'dismissAction' }
// → action.muted.text.default
```

#### TextField (Input composite)

```ts
// Main control
{ entity: 'Input', composition: 'control' }
// → input.primary.background.default, input.primary.border.default, input.primary.text.default

// Label
{ entity: 'Input', composition: 'label' }
// → input.primary.text.default

// Helper text
{ entity: 'Input', composition: 'description' }
// → input.muted.text.default

// Validation message
{ entity: 'Input', composition: 'status' }
// → input.negative.text.default
```

#### Dialog (Overlay composite)

```ts
// Heading
{ entity: 'Overlay', composition: 'heading' }
// → informational.primary.text.default

// Body
{ entity: 'Overlay', composition: 'body' }
// → informational.primary.text.default
```

#### Form (Structure composite)

```ts
// Actions row container
{ entity: 'Structure', composition: 'supporting' }
// → informational.muted.background.default

// Submit button inside the actions row
{ entity: 'Action', composition: 'primaryAction' }
// → action.primary.background.default
```

#### Destructive action

```ts
{
  entity: 'Action',
  composition: 'primaryAction',
  evaluation: 'negative',
  consequence: 'destructive',
}
// → action.negative.background.default, action.negative.text.default
// A `destructive` consequence authorises downstream safe-default treatment of the cancel path.
```

---

## Rules

1. **Entity is always primary.** It defines the component, not the instance.
2. **Composition names a slot, not the component.** Composition never replaces Entity.
3. **Composition legality is per Entity.** A role is only valid on the Entities listed in the Composition roles table (source: `ENTITY_COMPOSITION`).
4. **Evaluation is semantic, not visual.** Choose it for its meaning, not its color.
5. **Consequence is about outcome risk.** It shapes interaction policy before styling.
6. **Keep the model small.** New values must come from the FSL foundation or be added through FSL governance.

> **Implementation:** See [UI Components](/docs/design/ui-components) for how this model is realized in React.
