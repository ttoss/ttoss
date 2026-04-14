---
title: Component Model
---

# Component Model

The Component Model is the **Component Semantics Projection** — [layer 3 of the FSL architecture](/docs/design/design-system/fsl/). It derives from the [FSL Lexicon](/docs/design/design-system/fsl/fls-lexicon) and [FSL Structural Language](/docs/design/design-system/fsl/fls-structural-language) and must not define vocabulary that contradicts them.

The central rule:

> **A component has an immutable identity. An instance carries that identity into a composition.**

## FSL dimension mapping

The model uses projection-scoped names for FSL dimensions (authorized by FSL Structural Language §17.1):

| FSL dimension    | Model name         | Notes                                                                                                                                                              |
| :--------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity Kind      | **Responsibility** | Values identical                                                                                                                                                   |
| Structural Role  | **Structure**      | Root structural role of the component (e.g. `root`); legal values constrained per Entity via `ENTITY_STRUCTURE`                                                    |
| Composition Role | **Host.Role**      | Restructured as bi-level model; ActionSet renames `primaryAction→primary`, `secondaryAction→secondary`, `dismissAction→dismiss` — Host disambiguates, no collision |
| Interaction Kind | **Interaction**    | Values identical; legal set constrained per Entity via `ENTITY_INTERACTION`; determines which States are valid                                                     |
| Evaluation       | **Evaluation**     | Values identical                                                                                                                                                   |
| Consequence      | **Consequence**    | Values identical                                                                                                                                                   |
| State            | **State**          | Values identical; legal set constrained per Interaction via `INTERACTION_STATE`                                                                                    |

## Responsibility → Token UX context mapping

The table below is the normative cross-projection mapping from FSL Entity Kind (Responsibility in this model) to the Semantic Token `ux` axis (layer 4). This mapping is the authoritative input for the resolver.

| Responsibility | Token `ux` context | Notes                                                                             |
| :------------- | :----------------- | :-------------------------------------------------------------------------------- |
| **Action**     | `action`           | 1:1                                                                               |
| **Input**      | `input`            | 1:1                                                                               |
| **Selection**  | `input`            | Selection components consume `input.*` tokens; no separate `selection` UX context |
| **Navigation** | `navigation`       | 1:1                                                                               |
| **Feedback**   | `feedback`         | 1:1                                                                               |
| **Collection** | `content`          | Collection surfaces consume `content.*` for structural coloring                   |
| **Overlay**    | `content`          | Overlay surfaces consume `content.*` for surface coloring                         |
| **Disclosure** | `navigation`       | Disclosure triggers colored as `navigation.*` when acting as location anchors     |
| **Structure**  | `content`          | Structural surfaces consume `content.*`                                           |

For the full `ux` role and state grammar, see the [Colors family — FSL Entity Kind Mapping](/docs/design/design-system/design-tokens/colors#fsl-entity-kind-mapping).

## ComponentExpression

The model is expressed as a `ComponentExpression` — the typed semantic expression that the resolver consumes:

```ts
type ComponentExpression = {
  responsibility: Responsibility; // required — what the component IS
  interaction?: Interaction; // optional — interaction kind expressed by the component
  composition?: HostRole; // optional — { host, role } pair, type-safe
  evaluation?: Evaluation; // optional — emphatic meaning
  consequence?: Consequence; // optional — risk profile
};
```

All dimensions are defined in `taxonomy.ts` and derived from FSL core vocabulary.

> **Code types:** The implementation exposes two artifacts from `semantics/`:
>
> - `ComponentMeta<E>` — the identity type every component declares (`entity`, `structure`, `interaction?`).
> - `SemanticExpression` — the runtime expression type used by the resolver (`entity`, `structure`, `interaction?`, `evaluation?`, `consequence?`).

---

## Responsibility

Responsibility answers: _What is this component?_

Every component has exactly one Responsibility. It cannot change based on context, variant, or usage. If a different Responsibility is required, a different component must exist.

| Responsibility | Use for                                             | Typical examples                      |
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

Composition answers: _Where does this instance participate, and in what role?_

When composition matters, an instance participates through a **Host** and a **Role**. When absent, the component resolves tokens from its Responsibility default.

### Host

A Host defines the compositional structure.

| Host             | Use for                                        |
| :--------------- | :--------------------------------------------- |
| **ActionSet**    | groups of actions in the same surface          |
| **FieldFrame**   | fields and their supporting elements           |
| **ItemFrame**    | internal structure of items in collections     |
| **SurfaceFrame** | structured surfaces and their internal regions |

### Role

A Role defines what the instance does inside its Host.

| Host             | Role                | Use for                                  |
| :--------------- | :------------------ | :--------------------------------------- |
| **ActionSet**    | `primary`           | the main action of the set               |
| **ActionSet**    | `secondary`         | supporting or alternative actions        |
| **ActionSet**    | `dismiss`           | leaving or closing without committing    |
| **FieldFrame**   | `control`           | the main input control                   |
| **FieldFrame**   | `label`             | the field label                          |
| **FieldFrame**   | `description`       | supporting or helper text                |
| **FieldFrame**   | `leadingAdornment`  | content before the control               |
| **FieldFrame**   | `trailingAdornment` | content after the control                |
| **FieldFrame**   | `validationMessage` | validation or error feedback             |
| **ItemFrame**    | `label`             | the main item label                      |
| **ItemFrame**    | `description`       | supporting item text                     |
| **ItemFrame**    | `supportingVisual`  | icon, avatar, or supporting visual       |
| **ItemFrame**    | `trailingMeta`      | trailing metadata or secondary value     |
| **ItemFrame**    | `selectionControl`  | checkbox, radio, or selection affordance |
| **SurfaceFrame** | `media`             | visual media region                      |
| **SurfaceFrame** | `heading`           | heading region                           |
| **SurfaceFrame** | `body`              | main supporting content                  |
| **SurfaceFrame** | `actions`           | actions area                             |
| **SurfaceFrame** | `status`            | status or feedback area                  |

---

## Evaluation

Evaluation answers: _What emphatic or evaluative meaning does this expression carry?_

Evaluation is optional. When omitted, it is inferred by the resolver from the Responsibility and composition context. Add it explicitly only when the default inference is wrong.

| Value         | Use for                              |
| :------------ | :----------------------------------- |
| **primary**   | main intended emphasis               |
| **secondary** | subordinate but still intentional    |
| **accent**    | deliberately differentiated emphasis |
| **muted**     | de-emphasized but still meaningful   |
| **positive**  | affirming, successful, or favorable  |
| **caution**   | warning or careful-attention signal  |
| **negative**  | harmful, erroneous, or adverse       |

---

## Consequence

Consequence answers: _What user-facing consequence or risk profile does this carry?_

Consequence is optional. When omitted, `neutral` is implied. Distinct from Evaluation: `negative` is evaluative meaning; `destructive` is outcome risk — both may appear simultaneously.

| Value                   | Use for                                       |
| :---------------------- | :-------------------------------------------- |
| **neutral**             | no special risk profile                       |
| **reversible**          | effect can be undone                          |
| **committing**          | moves to a more committed state               |
| **destructive**         | causes deletion or materially harmful loss    |
| **interruptive**        | interrupts flow and demands handling          |
| **recoverable**         | adverse path exists but recovery is supported |
| **safeDefaultRequired** | the safer path must be privileged             |

---

## Interaction

Interaction answers: _How does this component interact with the user?_

Interaction is optional. Components with no interactive behavior (`Structure` surfaces, non-dismissable `Feedback`, `Collection` containers) omit it. When present, Interaction is constrained to what is legal for the component's Responsibility, and it determines which States are valid.

| Interaction         | Use for                                               | Legal Responsibilities |
| :------------------ | :---------------------------------------------------- | :--------------------- |
| **command**         | executing a command without a confirmation step       | Action                 |
| **confirm**         | executing with an explicit confirmation step          | Action                 |
| **dismiss**         | leaving or closing a surface without committing       | Action, Feedback       |
| **entry.text**      | free-text user entry                                  | Input                  |
| **entry.value**     | structured value entry (number, date, amount, etc.)   | Input                  |
| **select.single**   | choosing exactly one option from a set                | Selection              |
| **select.multi**    | choosing one or more options from a set               | Selection              |
| **toggle.binary**   | switching between two exclusive states                | Selection              |
| **toggle.tristate** | switching across three states (e.g. indeterminate)    | Selection              |
| **navigate.link**   | navigating to a destination (anchor / link semantics) | Navigation             |
| **navigate.step**   | moving through an ordered step sequence               | Navigation             |
| **disclose.toggle** | revealing or hiding content in place                  | Disclosure             |

---

## State

State answers: _What interactional or semantic condition is currently active?_

State is not a prop passed at the expression level — it is the CSS selector layer. States are legal only for specific Interactions:

| State             | Meaning                                        |
| :---------------- | :--------------------------------------------- |
| **default**       | No special condition active                    |
| **hover**         | Pointer is over the element                    |
| **active**        | Element is being activated / pressed           |
| **focused**       | Element has keyboard focus                     |
| **disabled**      | Element is not interactive                     |
| **selected**      | Item is selected within a collection           |
| **pressed**       | Toggle is in its on-press state                |
| **checked**       | Checkbox-like element is checked               |
| **indeterminate** | Mixed or partial selection state               |
| **expanded**      | Disclosure or select is open                   |
| **current**       | Navigation item matches the current location   |
| **visited**       | Link has been previously visited               |
| **droptarget**    | Element is a valid target for a drag operation |

Not all states are legal for every Interaction. For example, `checked` is only valid for selection interactions; `visited` only for `navigate.link`. Legality is enforced at build time via `INTERACTION_STATE` in `taxonomy.ts`.

---

## How to use the model

#### 1. Set Responsibility

Classify the component itself.

- `Button` → `Action`
- `SearchField` → `Input`
- `Menu` → `Collection`
- `Dialog` → `Overlay`

#### 2. Set Interaction when the component is interactive

Most interactive components carry an Interaction. Non-interactive components (labels, surfaces, icons) omit it.

- `Button` → `interaction: 'command'`
- `TextField` → `interaction: 'entry.text'`
- `Checkbox` → `interaction: 'toggle.binary'`
- `Link` → `interaction: 'navigate.link'`
- `Accordion trigger` → `interaction: 'disclose.toggle'`

#### 3. Add Host and Role when the instance is inside a structured composition

- `Button` in a dialog footer → `{ host: 'ActionSet', role: 'primary' }`
- `Text` under a field label → `{ host: 'FieldFrame', role: 'description' }`
- `Icon` inside a menu item → `{ host: 'ItemFrame', role: 'supportingVisual' }`
- `Buttons` inside a card → `{ host: 'SurfaceFrame', role: 'actions' }`

#### 4. Add Evaluation when the default inference isn't right

Most expressions don't need explicit Evaluation. Add it when the standard inference is wrong:

- Destructive confirm button → `evaluation: 'negative'`
- Success state feedback → `evaluation: 'positive'`
- Subdued ghost action → `evaluation: 'muted'`

#### 5. Add Consequence when the interaction carries a material risk profile

- Delete / irreversible action → `consequence: 'destructive'`
- Save with no undo → `consequence: 'committing'`

---

## Usage Examples

> Token paths reference the **Semantic Token Projection** (layer 4). They reflect the current token projection and will be confirmed during its re-engineering.

#### Dialog footer buttons

```ts
// Save
{ responsibility: 'Action', interaction: 'command', composition: { host: 'ActionSet', role: 'primary' } }
// → action.primary.background.default, action.primary.text.default

// Back to editing
{ responsibility: 'Action', interaction: 'command', composition: { host: 'ActionSet', role: 'secondary' } }
// → action.secondary.background.default, action.secondary.text.default

// Cancel
{ responsibility: 'Action', interaction: 'dismiss', composition: { host: 'ActionSet', role: 'dismiss' } }
// → action.muted.text.default
```

#### Search field

```ts
// Main control
{ responsibility: 'Input', interaction: 'entry.text', composition: { host: 'FieldFrame', role: 'control' } }
// → input.primary.border.default, input.primary.background.default, input.primary.text.default

// Label
{ responsibility: 'Structure', composition: { host: 'FieldFrame', role: 'label' } }
// → content.primary.text.default

// Helper text
{ responsibility: 'Structure', composition: { host: 'FieldFrame', role: 'description' } }
// → content.muted.text.default

// Leading icon
{ responsibility: 'Structure', composition: { host: 'FieldFrame', role: 'leadingAdornment' } }
// → content.muted.text.default
```

#### Menu item

```ts
{ responsibility: 'Structure', composition: { host: 'ItemFrame', role: 'label' } }
// → navigation.primary.text.default

{ responsibility: 'Structure', composition: { host: 'ItemFrame', role: 'description' } }
// → content.muted.text.default

{ responsibility: 'Structure', composition: { host: 'ItemFrame', role: 'supportingVisual' } }
// → navigation.secondary.text.default
```

#### Card

```ts
// Container
{ responsibility: 'Structure' }
// → content.primary.background.default

// Title
{ responsibility: 'Structure', composition: { host: 'SurfaceFrame', role: 'heading' } }
// → content.primary.text.default

// Body
{ responsibility: 'Structure', composition: { host: 'SurfaceFrame', role: 'body' } }
// → content.primary.text.default
```

#### Destructive action

```ts
{
  responsibility: 'Action',
  interaction: 'confirm',
  composition: { host: 'ActionSet', role: 'primary' },
  evaluation: 'negative',
  consequence: 'destructive',
}
// → action.negative.background.default, action.negative.text.default
// Downstream: resolver applies safeDefaultRequired constraint to the cancel path
```

---

## Rules

1. **Responsibility is always primary.** It defines the component, not the instance.
2. **Host never replaces Responsibility.** Host exists only to model composition.
3. **Role is always host-bound.** A Role has no meaning outside its Host.
4. **Evaluation is semantic, not visual.** Choose it for its meaning, not its color.
5. **Consequence is about outcome risk.** It shapes interaction policy before styling.
6. **Keep the model small.** New values must come from the FSL foundation or be added through FSL governance.

> **Implementation:** See [UI Components](/docs/design/ui-components) for how this model is realized in React.
