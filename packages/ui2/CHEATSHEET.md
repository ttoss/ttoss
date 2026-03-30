# ui2 Cheat Sheet

Quick reference: `resolveTokens({ responsibility })` → TokenSpec → CSS vars.

## Responsibility → TokenSpec → CSS Custom Properties

| Responsibility | color                | textStyle  | spacing         | sizing        | radii     | elevation |
| -------------- | -------------------- | ---------- | --------------- | ------------- | --------- | --------- |
| **Action**     | `action.primary`     | `label.md` | `inset.control` | `hit.default` | `control` | —         |
| **Input**      | `input.primary`      | `body.md`  | `inset.control` | `hit.default` | `control` | —         |
| **Selection**  | `input.primary`      | `label.md` | `inset.control` | —             | —         | —         |
| **Collection** | `content.primary`    | `body.md`  | `inset.surface` | —             | —         | —         |
| **Navigation** | `navigation.primary` | `label.md` | `inset.control` | —             | —         | —         |
| **Disclosure** | `content.primary`    | `body.md`  | `inset.control` | —             | —         | —         |
| **Overlay**    | `content.primary`    | `body.md`  | `inset.surface` | —             | `surface` | `modal`   |
| **Feedback**   | `feedback.primary`   | `body.md`  | `inset.surface` | —             | `surface` | —         |
| **Structure**  | `content.primary`    | `body.md`  | `inset.surface` | —             | —         | —         |

## TokenSpec → CSS var names

| TokenSpec field   | Utility                              | Example output                                                                        |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `color`           | `colorVar(color, dimension, state?)` | `colorVar('action.primary', 'background')` → `--tt-action-primary-background-default` |
| `textStyle`       | `textStyleVars(textStyle)`           | `textStyleVars('label.md')` → `{ fontFamily: '--tt-text-label-md-fontFamily', ... }`  |
| `spacing`         | `spacingVar(spacing, step)`          | `spacingVar('inset.control', 'md')` → `--tt-spacing-inset-control-md`                 |
| `sizing`          | `sizingVar(sizing)`                  | `sizingVar('hit.default')` → `--tt-sizing-hit-default`                                |
| `radii`           | `radiiVar(radii)`                    | `radiiVar('control')` → `--tt-radii-semantic-control`                                 |
| `elevation`       | `elevationVar(elevation)`            | `elevationVar('modal')` → `--tt-elevation-modal`                                      |
| _(cross-cutting)_ | `opacityVar(alias)`                  | `opacityVar('disabled')` → `--tt-opacity-disabled`                                    |

## Composition Overrides (Host.Role)

When a component participates in a composition, Host.Role **overrides** specific fields (the rest stays from Responsibility defaults).

| Host.Role                      | Overrides                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `ActionSet.primary`            | color → `action.primary`                                                                     |
| `ActionSet.secondary`          | color → `action.secondary`                                                                   |
| `ActionSet.dismiss`            | color → `action.muted`                                                                       |
| `FieldFrame.control`           | color → `input.primary`, textStyle → `body.md`, spacing → `inset.control`, radii → `control` |
| `FieldFrame.label`             | color → `content.primary`, textStyle → `label.md`                                            |
| `FieldFrame.description`       | color → `content.muted`, textStyle → `body.sm`                                               |
| `FieldFrame.validationMessage` | color → `feedback.negative`, textStyle → `body.sm`                                           |
| `SurfaceFrame.heading`         | color → `content.primary`, textStyle → `title.md`                                            |
| `SurfaceFrame.body`            | color → `content.primary`, textStyle → `body.md`, spacing → `gap.stack`                      |
| `SurfaceFrame.actions`         | spacing → `separation.interactive.min`                                                       |

## CSS Rules

- **No fallbacks**: use `var(--tt-token)`, never `var(--tt-token, fallback)`. The default theme is complete.
- **Semantic tokens only**: never reference core tokens (`--tt-space-*`, `--tt-color-*` raw scales).
- **No hardcoded values**: never use raw hex colors, rgba, or numeric opacity. Use `--tt-*` tokens instead.

## Workflow

```
1. Classify    →  Responsibility + optional Host.Role
2. Query       →  resolveTokens({ responsibility, host?, role? })
3. CSS vars    →  colorVar(), spacingVar(), radiiVar(), etc.
4. Implement   →  .ui2-{slug} { var(--tt-...) }
5. Validate    →  pnpm run test (contract tests catch drift)
```

## Scaffold

```bash
pnpm run new-component <slug> --responsibility <R> [--kind composite] [--host <Host>]
```

Generates: component `.tsx`, CSS with correct `--tt-*` stubs, model entry, registry entry, starter Storybook story.
