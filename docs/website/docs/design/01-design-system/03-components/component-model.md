---
title: Component Model
---

# Component Model

ttoss Components is built on the rule:

> **a component has an identity, and an instance has a role in composition.**

This model is organized into **two categories**:

- **Component Identity** — what the component is
- **Composition Model** — how an instance participates in composition

These categories are expressed through **three dimensions**:

- **Responsibility** — the component’s semantic identity
- **Host** — the compositional structure where the instance participates
- **Role** — what the instance does inside that host

That is the full model.

## The model

A component is defined first by its **Responsibility**.
When composition matters, an instance may then participate through a **Host** and a **Role**.

In practice:

- **Component Identity** → `Responsibility`
- **Composition Model** → `Host.Role`

This keeps the public component model small and stable while still allowing ttoss to express real interface composition.

### Responsibility

It defines the component’s semantic identity and the type of behavior it represents in the system.

It answers:

- _What is this component?_

Every public ttoss component must have exactly **one** Responsibility.
Because of that, a component cannot change its Responsibility depending on context, visual style, or usage. If the semantic responsibility changes, then it is not the same component.

In other words:

> If a different Responsibility is required, a different component must exist.

This rule keeps the system predictable for both humans and AI systems. Responsibility determines how tokens are resolved, how components compose, and what behavior is expected from the component. Allowing a component to change its Responsibility would break that contract.

| Responsibility | Use for                                             | Typical examples                      |
| -------------- | --------------------------------------------------- | ------------------------------------- |
| **Action**     | triggering actions or commands                      | button, action button, icon button    |
| **Input**      | direct user input                                   | text field, text area, search field   |
| **Selection**  | choosing one or more options                        | checkbox, radio group, select, picker |
| **Collection** | structured sets of items                            | menu, list, table, tree, grid         |
| **Navigation** | movement across destinations or views               | link, breadcrumbs, tabs, nav item     |
| **Disclosure** | revealing or hiding related content in place        | accordion, disclosure trigger         |
| **Overlay**    | temporary layered UI above the interface            | dialog, popover, tooltip, drawer      |
| **Feedback**   | communicating state, status, or outcome             | alert, banner, toast, progress        |
| **Structure**  | organizing interface structure and support surfaces | panel, section, shell, frame          |

### Composition Model

A **Host** defines the compositional structure. It answers:

- _What kind of composition is this?_

| Host             | Use for                                        |
| :--------------- | :--------------------------------------------- |
| **ActionSet**    | groups of actions in the same surface          |
| **FieldFrame**   | fields and their supporting elements           |
| **ItemFrame**    | internal structure of items in collections     |
| **SurfaceFrame** | structured surfaces and their internal regions |

A **Role** defines what an instance does inside a Host. It answers:

- _What is this instance doing here?_

> Use `Host.Role` only when structured composition matters.
> When `Host.Role` is absent (standalone components), the component resolves tokens from its Responsibility default.

Composition refines that default through `Host.Role`.

#### Summary Table

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

## How to use the model

Use the model in this order:

#### 1. Choose the Responsibility

Start by classifying the component itself. Ask:

- _What is this component?_

Examples:

- `Button` → `Action`
- `SearchField` → `Input`
- `Menu` → `Collection`
- `Dialog` → `Overlay`

#### 2. Add Host and Role when composition matters

If the instance participates in a structured composition, assign a Host and a Role. Ask:

- _What composition is this part of?_
- _What is this instance doing inside it?_

Examples:

- `Button` in a dialog footer → `ActionSet.primary`
- `Text` under a field label → `FieldFrame.description`
- `Icon` inside a menu item → `ItemFrame.supportingVisual`
- `Buttons` inside a card → `SurfaceFrame.actions`

#### 3. Resolve semantic tokens from the model

Once `Responsibility` and `Host.Role` are clear, resolve tokens by foundation.

Use the model to choose:

- **color** → semantic color tokens
- **typography** → semantic `text.*` styles
- **spacing** → semantic spacing tokens
- **sizing** → semantic sizing tokens
- **elevation** → semantic elevation tokens when relevant
- **radii** → semantic radii aliases when relevant

Quick examples:

- `Action` + `ActionSet.primary` → `action.primary.*`
- `Action` + `ActionSet.secondary` → `action.secondary.*`
- `Action` + `ActionSet.dismiss` → usually `action.muted.*`
- `Structure` + `FieldFrame.label` → usually `text.label.md`
- `Structure` + `FieldFrame.description` → usually `text.body.sm` + `content.muted.text.default`
- `Structure` + `ItemFrame.supportingVisual` → usually `icon.md` + a semantic `*.text.*` color
- `Structure` + `SurfaceFrame.heading` → usually `text.title.md`
- `Structure` + `SurfaceFrame.body` → usually `text.body.md`

The model defines meaning first.  
Tokens then express that meaning through each foundation.

## Usage Examples

#### Dialog footer button

- button save → `Action` + `ActionSet.primary`
  - color: `action.primary.background.default`, `action.primary.text.default`
  - typography: `text.label.md`
  - spacing/sizing: `spacing.inset.control.md`, `hit.base`
  - radius: `radii.control`

- button back to editing → `Action` + `ActionSet.secondary`
  - color: `action.secondary.background.default`, `action.secondary.text.default`
  - typography: `text.label.md`
  - spacing/sizing: `spacing.inset.control.md`, `hit.base`
  - radius: `radii.control`

- button cancel → `Action` + `ActionSet.dismiss`
  - color: `action.muted.text.default`
  - typography: `text.label.md`
  - spacing/sizing: `spacing.inset.control.md`, `hit.base`
  - radius: `radii.control`

#### Search field

- main field control → `Input` + `FieldFrame.control`
  - color: `input.primary.border.default`, `input.primary.background.default`, `input.primary.text.default`
  - typography: `text.body.md`
  - spacing/sizing: `spacing.inset.control.md`, `hit.base`
  - radius: `radii.control`

- field label text → `Structure` + `FieldFrame.label`
  - color: `content.primary.text.default`
  - typography: `text.label.md`

- helper text → `Structure` + `FieldFrame.description`
  - color: `content.muted.text.default`
  - typography: `text.body.sm`

- leading search icon → `Structure` + `FieldFrame.leadingAdornment`
  - color: `content.muted.text.default`
  - sizing: `icon.md`
  - spacing: usually grouped with the control through `spacing.gap.inline.sm`

#### Menu item

- menu item label text → `Structure` + `ItemFrame.label`
  - color: `navigation.primary.text.default`
  - typography: `text.label.md`

- item description text → `Structure` + `ItemFrame.description`
  - color: `content.muted.text.default`
  - typography: `text.body.sm`

- leading icon → `Structure` + `ItemFrame.supportingVisual`
  - color: `navigation.secondary.text.default` or `content.muted.text.default`
  - sizing: `icon.md`

#### Card or panel

- container → `Structure`
  - color: `content.primary.background.default`
  - spacing: `spacing.inset.surface.md`
  - radius: `radii.surface`
  - elevation: `elevation.resting`

- title text → `Structure` + `SurfaceFrame.heading`
  - color: `content.primary.text.default`
  - typography: `text.title.md`

- body content → `Structure` + `SurfaceFrame.body`
  - color: `content.primary.text.default`
  - typography: `text.body.md`
  - spacing: `spacing.gap.stack.sm`

- action buttons → `Action` + `SurfaceFrame.actions`
  - spacing: `spacing.separation.interactive.min`
  - tokens for each button still come from their own role in the action set they form

---

## Rules

#### 1. Responsibility is always primary

Responsibility defines the component itself.

#### 2. Host never replaces Responsibility

Host exists only to model composition.

#### 3. Role is always host-bound

A Role has no meaning outside its Host.

#### 4. Keep the model small

Do not create new Responsibilities, Hosts, or Roles casually.  
The goal is a system that stays clear, stable, and reusable.

> **Implementation:** See [UI Components](/docs/design/ui-components) for how this model is realized in React.
