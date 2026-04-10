---
title: FSL Lexicon
---

# FSL Lexicon

> **The FSL Lexicon is the normative dictionary of the Foundational Semantic Language.**
>
> It defines the canonical meanings of the core terms of the language so that components, tokens, themes, tooling, and AI systems can derive from the same semantic base without drift.

This document contains the **actual core vocabulary** of FSL.

It does not explain how to write lexicons in general.
It defines the foundational terms themselves.

## What this lexicon covers

This lexicon covers the **FSL core only**:

* Entity Kind
* Structural Role
* Interaction Kind
* Composition Role
* Evaluation
* Consequence
* State
* Layer Role
* Context Class

This lexicon does **not** include projection-specific vocabularies such as:

* token-family domains
* text scales
* spacing contracts
* size contracts
* boundary contracts

Those belong to derived projection lexicons, not to the FSL core.

## Lexical laws

These rules are normative for the core lexicon.

1. **One preferred term, one core meaning.**
2. **Context may refine meaning but must not redefine core identity.**
3. **Core terms must be defined independently of styling, token paths, or component APIs.**
4. **If two terms express materially different meaning, they must remain distinct.**
5. **If a meaning belongs only to a downstream projection, it must not enter the FSL core lexicon.**

## Reading convention

Each entry contains:

* **Term** — canonical label
* **Meaning** — normative definition
* **Distinguish from** — the nearest concepts it must not collapse into

---

# 1. Entity Kind

Entity Kind answers:

> **What kind of interactive thing is this?**

Entity Kind is the most stable semantic identity in the language.
It is the closest thing FSL has to “what this thing fundamentally is”.

Entity Kinds are **pairwise disjoint** in the core lexicon.

| Term           | Meaning                                                                                                                      | Distinguish from                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Action**     | An interactive entity whose primary meaning is to trigger, initiate, confirm, submit, or dismiss an action in the system.    | Not **Navigation** (movement across destinations), not **Input** (value entry), not **Feedback** (status communication).        |
| **Input**      | An interactive entity whose primary meaning is entering, editing, or manipulating a value directly.                          | Not **Selection** (choosing among options), not **Action** (performing an operation).                                           |
| **Selection**  | An interactive entity whose primary meaning is choosing one or more options from a set.                                      | Not **Input** in general; some selection UIs may feel input-like, but their semantic core is choice, not arbitrary value entry. |
| **Collection** | An entity whose primary meaning is organizing and presenting sets of items, options, records, or content units.              | Not **Structure** in general; Collection is about grouped items as an information set, not just layout/support.                 |
| **Overlay**    | An entity whose primary meaning is temporary layered presentation above the base interface.                                  | Not **Disclosure**; Disclosure reveals in place, Overlay creates a layered interaction context.                                 |
| **Navigation** | An entity whose primary meaning is moving, orienting, or stepping across destinations, locations, or information spaces.     | Not **Action**; a link may look actionable, but its semantic core is movement/orientation, not command execution.               |
| **Disclosure** | An entity whose primary meaning is revealing or hiding related content in place without creating a separate layered context. | Not **Overlay**; not all show/hide behavior creates a layered surface.                                                          |
| **Feedback**   | An entity whose primary meaning is communicating state, outcome, condition, warning, success, failure, or system response.   | Not **Action** or **Overlay**; a feedback object may appear inside those, but its identity is communicative, not operational.   |
| **Structure**  | An entity whose primary meaning is organizing, supporting, grouping, separating, or framing content and interaction.         | Not **Collection**; Structure is about support/form, Collection is about a set of items as a semantic grouping.                 |

### Critical disambiguations

* **Action** is not the same as **primaryAction**.
  `Action` is an entity kind. `primaryAction` is a composition role.

* **Selection** is not the same as **toggle.binary** or **select.single**.
  `Selection` is an entity kind. Those are interaction kinds.

* **Overlay** is not the same as **blocking**.
  `Overlay` is an entity kind. `blocking` is a layer role.

---

# 2. Structural Role

Structural Role answers:

> **What structural function does this part play?**

Structural Roles describe semantic topology inside entities and composites.

Unlike Entity Kinds, Structural Roles are **not globally disjoint**.
The same structural role may lawfully appear under different entities.

| Term                 | Meaning                                                                                         | Distinguish from                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **root**             | The primary semantic container of an entity as a whole.                                         | Not just “outer DOM node”; root is the semantic whole of the entity.                                 |
| **control**          | The primary interactive part through which the entity is directly operated.                     | Not **trigger** in general; a trigger invokes another structure, a control may be the entity itself. |
| **surface**          | A semantically meaningful containing plane or container that holds content or interaction.      | Not **content**; surface is the containing support, content is what is carried.                      |
| **content**          | The main carried content of an entity or composite.                                             | Not **body** in all cases; body is a specific text/content role, content is broader.                 |
| **label**            | A naming or identifying part that tells the user what an entity or option is.                   | Not **title** in general; title is more heading-like, label is directly naming/identifying.          |
| **description**      | A supporting explanatory part that clarifies meaning, conditions, or usage.                     | Not **status**; description explains, status communicates current condition/outcome.                 |
| **title**            | A heading-like part that introduces or names a larger content or surface unit.                  | Not **label**; title organizes a larger unit, label identifies a more immediate one.                 |
| **body**             | The primary explanatory or descriptive content body of an entity or surface.                    | Not **content** in general; body is a specific textual/content-bearing role.                         |
| **actions**          | A grouped area or region that contains one or more action-bearing parts.                        | Not a single action itself.                                                                          |
| **status**           | A part whose function is to communicate condition, progress, success, warning, or error.        | Not **description**; status is current condition, description is explanatory support.                |
| **icon**             | A compact symbolic or pictorial supporting part.                                                | Not **indicator**; icon may identify or decorate, indicator signals state or choice.                 |
| **indicator**        | A part whose role is to signal state, selection, or position.                                   | Not **icon** in general; indicator has a signaling function.                                         |
| **item**             | A member unit inside a collection or grouped set.                                               | Not **content** in general; item implies membership in a set.                                        |
| **trigger**          | A part whose role is to invoke, open, reveal, or activate another entity or structure.          | Not **control** in general; trigger is relational and points to something else.                      |
| **backdrop**         | A layered part positioned between an overlayed structure and the obscured underlying interface. | Not **surface**; backdrop is environmental/layering support, not primary carried surface.            |
| **positioner**       | A part whose role is to place or anchor another layered structure spatially.                    | Not generic layout; it is specifically for semantic positioning of another structure.                |
| **closeTrigger**     | A trigger whose role is specifically to close or dismiss the current entity.                    | Not every dismiss action; this is specifically a trigger part.                                       |
| **supportingVisual** | A non-primary visual part that supports recognition, context, or grouping.                      | Not **media** in general; supportingVisual is subordinate and usually lighter-weight.                |
| **trailingMeta**     | A secondary trailing part that carries supporting metadata or contextual detail.                | Not **status**; metadata is not necessarily current state.                                           |
| **selectionControl** | A structural part whose immediate role is selection or toggle operation within a larger entity. | Not generic **control**; this specifically participates in selection semantics.                      |
| **media**            | A part whose role is carrying image, video, illustration, or rich visual media.                 | Not **icon**; media is richer and semantically broader.                                              |
| **leadingAdornment**  | A supporting part positioned before the primary control, carrying a visual cue, prefix, or contextual element. | Not **control**; this part is subordinate and does not itself bear the primary interaction.  |
| **trailingAdornment** | A supporting part positioned after the primary control, carrying a visual cue, suffix, or affordance.          | Not **control**; this part is subordinate and contextual.                                    |
| **validationMessage** | A part whose role is to communicate the outcome of validation for the associated entry or selection.           | Not **status**; validationMessage is specific to validation outcome, not general condition.  |

### Critical disambiguations

* **trigger** is relational; **control** is direct.
  A combobox control is not merely a trigger.
  A button that opens a dialog is often a trigger.

* **label** and **title** are not synonyms.
  `label` identifies an immediate thing.
  `title` introduces a larger semantic unit.

* **description** and **status** are not synonyms.
  `description` explains.
  `status` communicates current condition.

---

# 3. Interaction Kind

Interaction Kind answers:

> **What kind of interaction is being expressed?**

Interaction Kind is fundamental because interactive meaning cannot be recovered safely from structure alone.

| Term                    | Meaning                                                                                                                  | Distinguish from                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **command**             | An interaction that issues an operation or command without primarily representing navigation, value entry, or selection. | Not **navigate.link**, not **entry.text**, not **select.single**.               |
| **confirm**             | An interaction that explicitly affirms, commits, or accepts a pending operation or state transition.                     | Not generic **command**; confirm is a committing subtype of action.             |
| **dismiss**             | An interaction that closes, cancels, exits, or retreats from the current interaction path.                               | Not **secondary** or **muted**; dismiss is not an emphasis level.               |
| **entry.text**          | An interaction centered on entering or editing free-form text.                                                           | Not **entry.value** in general; text is one subtype of value entry.             |
| **entry.value**         | An interaction centered on entering or manipulating a value, not necessarily text.                                       | Broader than **entry.text**.                                                    |
| **select.single**       | An interaction that chooses exactly one option from a set.                                                               | Not **select.multi** or **toggle.binary**.                                      |
| **select.multi**        | An interaction that chooses more than one option from a set.                                                             | Not **select.single**.                                                          |
| **toggle.binary**       | An interaction that switches between two discrete states.                                                                | Not **toggle.tristate**.                                                        |
| **toggle.tristate**     | An interaction that can lawfully occupy three states, including an indeterminate or partial state.                       | Not **toggle.binary**.                                                          |
| **navigate.link**       | An interaction whose primary function is movement to another destination or location.                                    | Not **command**; even if visually button-like, its semantic core is navigation. |
| **navigate.step**       | An interaction whose function is progression between stages, screens, or ordered steps.                                  | Not general navigation across arbitrary destinations.                           |
| **disclose.toggle**     | An interaction that reveals or hides related content in place.                                                           | Not **popup.dialog** or other overlay-like interactions.                        |
| **popup.listbox**       | An interaction that invokes or operates through a popup whose semantic content is listbox-like.                          | Not **popup.dialog**, **popup.grid**, or **popup.tree**.                        |
| **popup.grid**          | An interaction that invokes or operates through a popup whose semantic content is grid-like.                             | Not **popup.listbox**.                                                          |
| **popup.tree**          | An interaction that invokes or operates through a popup whose semantic content is tree-like.                             | Not **popup.listbox** or **popup.grid**.                                        |
| **popup.dialog**        | An interaction that invokes or operates through a popup whose semantic content is dialog-like.                           | Not generic popup; specifically dialog semantics.                               |
| **status.passive**      | A communicative condition that informs without demanding immediate user action.                                          | Not **status.interruptive**.                                                    |
| **status.interruptive** | A communicative condition that interrupts, escalates, or demands immediate handling.                                     | Not passive informational status.                                               |

### Critical disambiguations

* **confirm** is not just a “primary button”.
  It is an interaction kind with commitment semantics.

* **dismiss** is not just a low-emphasis button.
  It is an interaction kind with retreat/close semantics.

* `popup.*` kinds exist to prevent collapsing all popup behavior into one ambiguous bucket.

---

# 4. Composition Role

Composition Role answers:

> **What role does this entity or part play inside a larger composition?**

Composition Role is relational.
It never replaces Entity Kind.

| Term                | Meaning                                                                                        | Distinguish from                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **primaryAction**   | The main forward, commit, or preferred action path within a composition.                       | Not **Action** itself; this is a compositional role, not an entity kind.          |
| **secondaryAction** | A subordinate but still intentional action path within a composition.                          | Not **dismissAction**; secondary is not necessarily exit/cancel.                  |
| **dismissAction**   | An action whose role is to cancel, close, back out, or safely dismiss the current flow.        | Not generic **secondaryAction**; dismiss is semantically specific.                |
| **heading**         | A compositional role introducing the primary heading of a larger unit.                         | Not generic **title** in every context; this is relational to a composition.      |
| **body**            | A compositional role carrying the main explanatory or substantive content of a larger unit.    | Not generic **content**; not the same as `body` Structural Role — in Composition, this designates the slot, not the part itself.                                      |
| **status**          | A compositional role carrying state, outcome, or condition communication within a composition. | Not generic **description**; not the same as `status` Structural Role — in Composition, this designates the slot, not the part itself.                               |
| **control**     | A compositional role designating where the primary control-bearing child belongs.              | Not the same as `control` Structural Role; in Composition, this names the slot, not the part itself. |
| **label**       | A compositional role designating where a naming/label child belongs.                           | Not the same as `label` Structural Role; in Composition, this names the parent-side slot.            |
| **description** | A compositional role designating where a descriptive child belongs.                            | Not the same as `description` Structural Role; in Composition, this names the parent-side slot.      |
| **supporting**  | A compositional role designating where a supporting child belongs.                             | Broader than specific label/description/status slots.                                                |
| **selection**   | A compositional role designating where a selection-bearing child belongs.                      | Not the same as `selectionControl` Structural Role; in Composition, this names the slot.             |

### Critical disambiguations

* Structural roles describe the part itself.
* Composition roles describe what that part means **in relation to a larger composition**.

This distinction is mandatory.

---

# 5. Evaluation

Evaluation answers:

> **What evaluative or emphatic meaning does this expression carry?**

Evaluation is not styling and not token choice.
It is semantic emphasis or valence.

| Term          | Meaning                                                                                                    | Distinguish from                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **primary**   | The main intended emphasis in a semantic context.                                                          | Not “blue”, “bold”, or any visual style.                                                         |
| **secondary** | A secondary but still intentional emphasis relative to the same context.                                   | Not equivalent to dismiss, muted, or less important in every case.                               |
| **accent**    | A deliberately differentiated emphasis used to highlight meaningful distinction from the default emphasis. | Not just “more colorful”; accent is semantic divergence.                                         |
| **muted**     | A de-emphasized but still meaningful evaluation.                                                           | Not “disabled”, not “inactive”, not “secondary” in general.                                      |
| **positive**  | An affirming, successful, healthy, or favorable evaluation.                                                | Not the same as “success UI token”; this is foundational meaning.                                |
| **caution**   | A warning or careful-attention evaluation.                                                                 | Not the same as “negative”; caution signals risk, not necessarily harmful outcome.               |
| **negative**  | A harmful, erroneous, destructive, or adverse evaluation.                                                  | Not necessarily **destructive** consequence; evaluation and consequence are distinct dimensions. |

### Critical disambiguations

* **negative** ≠ **destructive**
  `negative` is evaluative.
  `destructive` is consequential.

* **muted** ≠ **disabled**
  `muted` still carries meaning.
  `disabled` is a state.

---

# 6. Consequence

Consequence answers:

> **What kind of user-facing consequence or risk profile does this interaction carry?**

Consequence exists because some meanings materially shape user experience and risk even before styling or implementation.

| Term                    | Meaning                                                                                     | Distinguish from                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **neutral**             | No special consequence or risk profile is implied beyond the baseline interaction.          | Not the absence of semantics; simply no special risk-bearing consequence.                 |
| **reversible**          | The effect can be undone or reverted without major loss.                                    | Not the same as `recoverable`; reversible means the original change itself can be undone. |
| **committing**          | The interaction moves the user or system into a more committed state.                       | Not every primary action is committing.                                                   |
| **destructive**         | The interaction causes deletion, invalidation, or materially harmful loss.                  | Not the same as `negative` in general.                                                    |
| **interruptive**        | The interaction or condition interrupts flow and demands immediate or prioritized handling. | Not every warning is interruptive.                                                        |
| **recoverable**         | A failure or adverse path exists, but recovery is expected to be supported.                 | Not the same as `reversible`; recoverable may involve repair, not simple undo.            |
| **safeDefaultRequired** | The interaction requires the safer option, default, focus, or path to be privileged.        | Not just “be careful”; this is a semantic requirement on downstream behavior.             |

### Critical disambiguations

* **destructive** describes outcome risk.
  It does not prescribe a specific visual treatment by itself.

* **safeDefaultRequired** is not a styling concern.
  It is a semantic constraint on interaction policy.

---

# 7. State

State answers:

> **What interactional or semantic state is active?**

State is governed by legality.
Not every state is meaningful for every interaction kind.

| Term              | Meaning                                                                                                | Distinguish from                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **default**       | The baseline state in the absence of another active state.                                             | Not “normal looking”; it is the unmodified semantic base state.                            |
| **hover**         | A pointer-proximity state indicating hover-capable engagement.                                         | Not `focused`; hover is not keyboard focus.                                                |
| **active**        | A currently engaged action state, often during direct interaction.                                     | Not `selected` or `pressed` in all cases.                                                  |
| **focused**       | A state indicating current input or interaction focus.                                                 | Not `hover`.                                                                               |
| **disabled**      | A state indicating the entity is unavailable for normal interaction.                                   | Not `muted`; disabled is availability, not emphasis.                                       |
| **selected**      | A state indicating inclusion or chosen membership in a set.                                            | Not always `checked`; selection and checkedness are related but not identical universally. |
| **pressed**       | A state indicating active pressed engagement, often in command/toggle controls.                        | Not always persistent like `selected`.                                                     |
| **checked**       | A state indicating affirmative selection or toggle-on condition in applicable interaction kinds.       | Not `selected` in every interaction model.                                                 |
| **indeterminate** | A state indicating partial, mixed, or unresolved condition in a tri-state model.                       | Not a visual ambiguity; it is a lawful third semantic state.                               |
| **expanded**      | A state indicating disclosed or expanded content/structure.                                            | Not `selected`; expansion is visibility structure.                                         |
| **current**       | A state indicating the current item, location, or active point in a navigational or ordered structure. | Not simply selected.                                                                       |
| **visited**       | A state indicating prior navigation visitation where such history is semantically meaningful.          | Not available for all interaction kinds.                                                   |
| **droptarget**    | A state indicating that the entity is currently a relevant target for drop-based interaction.          | Not generic active state.                                                                  |

### State law

* States are not free-form.
* `visited` only makes sense where navigation semantics support it.
* `indeterminate` only makes sense where tri-state interaction semantics support it.
* `checked` is not legal for every entity or interaction.

---

# 8. Layer Role

Layer Role answers:

> **What spatial or hierarchical layer role does this expression occupy?**

Layer Role is semantic layering, not raw stack arithmetic.

| Term          | Meaning                                                                                                                           | Distinguish from                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **base**      | The ordinary baseline layer of the interface.                                                                                     | Not `raised` or `overlay`.                                                 |
| **sticky**    | A persistent elevated-presence layer that remains attached to the base interaction context while retaining privileged visibility. | Not full overlay behavior.                                                 |
| **raised**    | A higher-emphasis surface or layer relative to the base, without necessarily becoming an overlay.                                 | Not the same as `overlay`.                                                 |
| **overlay**   | A layered role above the base interface that creates clear semantic separation.                                                   | Not necessarily `blocking`.                                                |
| **blocking**  | A layer role that not only overlays but also semantically blocks or captures interaction from the obscured context.               | Stronger than `overlay`.                                                   |
| **transient** | A temporary layer role that appears briefly, lightly, or ephemerally relative to the main interaction structure.                  | Not every overlay is transient, and not every transient layer is blocking. |

### Critical disambiguations

* **overlay** and **blocking** are not synonyms.
  Blocking is a stronger condition.

* **raised** does not imply modal or layered isolation.

---

# 9. Context Class

Context Class answers:

> **What kind of lawful contextual refinement is in play?**

Context does not invent base meaning.
It refines what already exists.

| Term                        | Meaning                                                                                                                                   | Distinguish from                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **composition**             | Context arising from semantic placement inside a larger composite structure.                                                              | Not environment or platform condition.                      |
| **environment**             | Context arising from the surrounding operating situation of the interface.                                                                | Broader than direct interaction mechanics.                  |
| **interactionEnvironment**  | Context arising from the conditions of interaction itself, such as device or input modality constraints relevant to interaction behavior. | Narrower than general environment.                          |
| **mode**                    | Context arising from a global or local semantic mode of operation.                                                                        | Not simply theme or styling mode.                           |
| **density**                 | Context arising from semantic compactness or spaciousness of interaction/content arrangement.                                             | Not just spacing values; this is contextual interpretation. |
| **accessibilityPreference** | Context arising from explicit accessibility-related user preference or need.                                                              | Not generic environment.                                    |
| **platformCondition**       | Context arising from platform-specific operating conditions that matter semantically.                                                     | Not local composition.                                      |

### Context law

* Context may refine.
* Context may not redefine Entity Kind.
* Context may not collapse distinctions already carried by foundational terms.

---

# 10. Critical ambiguity resolutions

This section records the most important foundational distinctions that the lexicon is intended to stabilize.

## 10.1 Action vs primaryAction

* **Action** is an Entity Kind.
* **primaryAction** is a Composition Role.

One says what the thing **is**.
The other says what role it plays **in a composition**.

## 10.2 Selection vs toggle.binary vs select.single

* **Selection** is an Entity Kind.
* **toggle.binary** and **select.single** are Interaction Kinds.

One says what kind of entity it is.
The other says how that entity is being interacted with.

## 10.3 label vs title

* **label** identifies an immediate thing.
* **title** introduces a larger semantic unit.

## 10.4 description vs status

* **description** explains.
* **status** communicates current condition or outcome.

## 10.5 negative vs destructive

* **negative** is Evaluation.
* **destructive** is Consequence.

A thing can be negative without being destructive.

## 10.6 muted vs disabled

* **muted** is Evaluation.
* **disabled** is State.

A thing can be muted and still interactive.
A disabled thing is unavailable for normal interaction.

## 10.7 overlay vs blocking

* **overlay** is Layer Role.
* **blocking** is a stronger Layer Role that captures or prevents interaction with the obscured context.

## 10.8 dismiss vs dismissAction vs closeTrigger

* **dismiss** is Interaction Kind.
* **dismissAction** is Composition Role.
* **closeTrigger** is Structural Role.

These must never be collapsed.

---

## 10.9 title vs heading

* **title** is a Structural Role — the topological function of a part that introduces its entity or surface.
* **heading** is a Composition Role — the relational function of that same part within a larger composite.

A single part may lawfully carry both: `structure: title` (what it is topologically) and `composition: heading` (what role it plays in the composition).

---

## 10.10 status.interruptive vs interruptive

* **status.interruptive** is an Interaction Kind — the mode of semantic operation of a status-communicating entity that operates in an interruptive way.
* **interruptive** is a Consequence — the user-facing impact profile of an interaction.

They model different dimensions and may lawfully co-exist. `status.interruptive` says *how* the entity operates; `interruptive` says *what impact* it has on the user. An expression can carry both simultaneously without redundancy.

---

## 10.11 content (Structural Role) vs content (token UX context)

* **content** as a Structural Role (§2) is the main carried content of an entity or composite — a topological part descriptor.
* **content** as a UX context in the Semantic Token Projection is a family-grouping for informational surfaces and readable content — a projection-stratum organizing concept.

These exist in different layers. The Structural Role describes part topology inside an entity. The token UX context organizes token families in the Semantic Token Projection. They do not conflict, but must not be conflated.

---

# 11. Core disjointness

The following disjointness rules are normative in the core lexicon.

## 11.1 Entity Kind

All Entity Kinds are pairwise disjoint.

## 11.2 Evaluation vs State vs Consequence

These dimensions are disjoint by kind of meaning:

* Evaluation = emphatic/valence meaning
* State = current condition
* Consequence = user-facing outcome/risk profile

## 11.3 Structural Role vs Composition Role

These dimensions serve different semantic purposes and must not be confused.

* Structural Role = part topology (describes the part itself)
* Composition Role = relational role in a larger whole (describes where a part belongs)

**Slot designator principle**: Any Structural Role term may lawfully appear in the Composition dimension as a slot designator — naming the position in a composition reserved for a structurally-typed part. The structural topology provides the naming convention; the dimension provides the semantic distinction. This is not a violation of disjointness.

Example: `leadingAdornment` in a Structural Role describes a part's topology. The same term in the Composition dimension designates the slot where a leading adornment part belongs in the whole.

## 11.4 Layer Role vs Entity Kind

A Layer Role must never be used as if it were an Entity Kind.

---

# 12. Downstream discipline

The FSL Lexicon is foundational.

Therefore:

1. No projection-specific term may be treated as foundational just because it is useful downstream.
2. No token-family term may silently replace a foundational concept.
3. No component API label may be treated as canonical unless it is grounded in a foundational or approved derived lexicon.
4. Derived lexicons may extend this one, but may not contradict it.

---

# 13. Final statement

This document is the normative dictionary of the FSL core.

It exists so that the system has:

* a real foundational vocabulary
* one canonical meaning per core term
* explicit distinctions between adjacent concepts
* a stable basis for composition
* a stable basis for projection
* a stable basis for deterministic resolution

Its purpose is not to describe implementation.

Its purpose is to ensure that all downstream semantic systems derive from the same language of meaning rather than inventing their own.
