# Theme Creation Instructions

For AI coding agents creating or reviewing themes in `@ttoss/theme-v2`.

---

## Architecture

```
core       → raw primitives (palettes, font, spacing engine, motion, elevation, radii)
semantic   → meaning-only aliases pointing to core tokens via '{core.path.to.token}'
components → consume semantic only (never core directly)
```

`createTheme({ overrides, alternate, extends, baseMode })` returns a `ThemeBundle`:

- `base` — fully resolved `ThemeTokens`
- `alternate` — `ModeOverride` for the opposite color mode (usually dark)
- `baseMode` — `'light'` (default) or `'dark'`

**Invariants:**

- Semantic tokens reference core tokens only. Never use raw hex/px in semantic overrides.
- Alternate remaps semantic references only. Core tokens are immutable across modes.

---

## Step 0 — Define the Identity (before writing code)

Declare these five axes in the JSDoc before implementing anything. They drive every token decision below.

| Axis            | Poles                | Key levers                                          |
| --------------- | -------------------- | --------------------------------------------------- |
| **Character**   | serious ↔ expressive | font weight, hue variety, state animation intensity |
| **Weight**      | delicate ↔ heavy     | border width, font weight, shadow depth             |
| **Temperature** | cool ↔ warm          | neutral undertone, brand hue frequency              |
| **Geometry**    | angular ↔ organic    | radii values                                        |
| **Density**     | compact ↔ spacious   | `core.spacing.engine.unit` clamp bounds             |

---

## Step 1 — Brand Palette (`core.colors.brand`)

Build 10 steps (50–900). Step 500 is required; others can be inherited if not yet needed.

### Constraints

1. White text on `brand.500` → **≥ 4.5:1** contrast ratio.
2. White text on `brand.700` → **≥ 4.5:1**.
3. `brand.700` on `brand.100` → **≥ 4.5:1** (input feedback surfaces).
4. `brand.900` on `brand.300` → **≥ 4.5:1** (dark mode — light brand bg + dark text).
5. Each step must be visibly distinct from its neighbors. Use OKLCH or CIELAB.
6. Hue must be recognizably the same family across all steps (minor hue shifts tolerated).
7. Saturation curve: low at 50–100 → peak near 500 → slightly lower at 600–900.
8. `brand.50` lightness: L* ≥ 95. `brand.900` lightness: L* ≤ 15.

---

## Step 2 — Neutral Scale (`core.colors.neutral`)

Override only if the base cool-blue-gray clashes with the theme temperature.

- **Achromatic** — safe default, works with any brand.
- **Chromatic** — tint toward brand hue or its complement. Max saturation: **S ≤ 0.03 in OKLCH**. Neutrals must still read as gray, not colored.
- Temperature rule: warm brand → warm neutrals (amber/stone undertone). Cool brand → keep base or use cool tint. Mixing temperatures creates visual dissonance.

---

## Step 3 — Validate Inherited Semantic Pairings

The baseTheme maps semantic slots to core references. When a new brand palette changes these resolved colors, contrast pairings must be re-validated.

| Semantic slot                                       | Default core ref             | Required contrast   |
| --------------------------------------------------- | ---------------------------- | ------------------- |
| `action.primary.background.default` → text          | `brand.500` → `neutral.0`    | ≥ 4.5:1             |
| `action.primary.background.hover` → text            | `brand.700` → `neutral.0`    | ≥ 4.5:1             |
| `action.primary.background.active` → text           | `brand.900` → `neutral.0`    | ≥ 4.5:1             |
| `navigation.primary.text.default` on surface        | `brand.700` on `neutral.0`   | ≥ 4.5:1             |
| `navigation.primary.text.hover` on surface          | `brand.900` on `neutral.0`   | ≥ 4.5:1             |
| `navigation.primary.text.visited` on surface        | `neutral.500` on `neutral.0` | ≥ 4.5:1             |
| `content.primary.text.default` on background        | `neutral.900` on `neutral.0` | ≥ 4.5:1             |
| `input.primary.border.default` on background        | `neutral.300` on `neutral.0` | ≥ 3:1 (non-text UI) |
| `feedback.{positive\|caution\|negative}.text` on bg | `{hue}.900` on `{hue}.100`   | ≥ 4.5:1             |
| `input.negative.text.default` on background         | `red.700` on `red.100`       | ≥ 4.5:1             |

**If a pairing fails:** add a semantic override pointing to a different core step. Do not modify core colors to fix a semantic problem.

### Navigation Color Roles

`navigation.*` covers both inline links and nav components. The four roles map to distinct visual patterns:

| Role        | Pattern                                        | Typical use                                   |
| ----------- | ---------------------------------------------- | --------------------------------------------- |
| `primary`   | Transparent bg, brand text, underline          | Inline links in body text, breadcrumbs        |
| `secondary` | Neutral light bg, dark text, neutral border    | Sidebar nav items, tab bars on light surfaces |
| `accent`    | Brand-tinted bg, brand text/border             | Active/featured nav items                     |
| `muted`     | Transparent bg, neutral-500 text, no underline | Footer links, utility nav, inactive items     |

**Dark sidebars**: `navigation.primary` in baseTheme is designed for **light surfaces** (transparent bg + brand text). For a dark sidebar override `navigation.secondary` or `navigation.primary` as a semantic override inside `createTheme({ overrides: { semantic: { colors: { navigation: { primary: { ... } } } } } })`. Do not design dark nav as the default `primary` in baseTheme — it conflicts with inline link use.

### Color Role Prominence Order

```
accent  >  negative  >  primary  >  secondary  >  muted
```

`accent` must be visually louder than `primary`. This fails by default because `action.primary` uses `brand.500` (peak saturation), leaving nothing louder for accent in the same hue family.

**Solutions (pick one):**

1. Use a contrasting or complementary hue for `action.accent.*`. Add it to `core.colors`.
2. Use a perceptually louder step (e.g., `brand.400` in some gamuts is more vibrant than `brand.500`).
3. Use temperature contrast (warm amber accent against cool blue primary).

**Never use** `brand.300` or `brand.700` for accent — same hue family at lower saturation, not louder.

### Color Triad Constraints (background + border + text)

These three dimensions are always visible simultaneously within one `{ux}.{role}.{state}`.

| Constraint            | Rule                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Triad coherence       | All three must feel intentionally related, not independently chosen.                                                                                                                 |
| Border dual context   | Border must contrast against its own background AND against the parent surface.                                                                                                      |
| Filled role pattern   | Mid-to-dark saturated bg + light text. Light bg with dark text reads as outlined.                                                                                                    |
| Outlined role pattern | Light/transparent bg + strong border + dark text. Border carries the visual weight.                                                                                                  |
| Ghost role pattern    | Near-transparent bg + subtle border + mid text. Text carries the visual weight.                                                                                                      |
| State transitions     | `default → hover → active`: all three dimensions shift in the same perceptual direction (all darken together, or all increase saturation together). No dimension reverses direction. |
| Feedback triads       | `positive` / `caution` / `negative` must differ in hue AND lightness. Hue alone is insufficient for colorblindness safety.                                                           |

---

## Step 4 — Non-Color Token Identity

Most themes fail to express personality beyond color. Push at least one of the following.

### Geometry (`semantic.radii` + `core.radii`)

| Geometry            | Override                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| Angular / brutalist | `semantic.radii.control: '{core.radii.none}'`, `surface: '{core.radii.sm}'` |
| Corporate (default) | No override needed                                                          |
| Playful / organic   | `semantic.radii.control: '{core.radii.xl}'`, `surface: '{core.radii.xl}'`   |
| Pill buttons        | `semantic.radii.control: '{core.radii.full}'`                               |

Override `core.radii` to change pixel values. Override `semantic.radii` to change which step each structural role maps to.

### Typography (`core.font`)

| Goal                | Override                                                                              |
| ------------------- | ------------------------------------------------------------------------------------- |
| Custom typeface     | `core.font.family.sans: '"YourFont", ui-sans-serif, system-ui, sans-serif'`           |
| Bolder identity     | Shift `core.font.weight` (e.g. `regular: 500, medium: 600, semibold: 700, bold: 800`) |
| Custom font metrics | Tune `core.font.leading` (x-height) and `core.font.tracking` (width)                  |

Do not modify `core.font.scale` clamp formulas unless the font requires radically different size ratios.

**Coupling constraint:** typography and spacing must be tuned in the same direction.

- Compact spacing → tight leading. Spacious spacing → relaxed leading.
- Mismatching directions creates visual dissonance.

### Spacing

**Single knob:** `core.spacing.engine.unit` cascades to all `core.spacing.*` steps via `calc(N * unit)`.

| Density  | Engine unit                                 |
| -------- | ------------------------------------------- |
| Compact  | `clamp(3px, 0.4cqi + 1.5px, 6px)`           |
| Default  | `clamp(4px, 0.5cqi + 2px, 8px)` (baseTheme) |
| Spacious | `clamp(5px, 0.6cqi + 3px, 10px)`            |

**Constraints:**

- Never override individual `core.spacing.*` steps with raw values — breaks the responsive cascade.
- Do not add new core spacing steps. Fixed set: 0, 1, 2, 3, 4, 6, 8, 12, 16.
- `inset.surface.{step}` must always be ≥ `inset.control.{step}`.

| Semantic pattern               | When to override                         |
| ------------------------------ | ---------------------------------------- |
| `inset.control.{sm\|md\|lg}`   | Controls feel too tight or too padded    |
| `inset.surface.{sm\|md\|lg}`   | Surfaces feel cramped or overly generous |
| `gap.stack.*` / `gap.inline.*` | Rarely — the engine handles this         |
| `gutter.{page\|section}`       | Almost never — structural, not identity  |
| `separation.interactive.min`   | Never — accessibility floor              |

### Sizing

Two natures — never confuse them:

**Fluid ramps** (`core.sizing.ramp.ui.*`, `core.sizing.ramp.layout.*`) — `clamp()` formulas, scale with container. Override clamp bounds (min/max) only. Keep `cqi` in the preferred term.

**Hit targets** (`core.sizing.hit.fine.*`, `core.sizing.hit.coarse.*`) — ergonomic floors.

- **Fine** (`mouse`, `trackpad`): may use `clamp(floor, preferred, max)` — `floor` must be a fixed `Npx` value (the ergonomic guarantee); `preferred` may scale with `rem` for density control.
- **Coarse** (`touch`): always fixed `px`. Touch ergonomics require predictable, reliable targets.
- `coarse.*` floor ≥ `fine.*` floor counterpart (always).
- Step order must be preserved: `min < base < prominent`.
- Hit tokens express target prominence (secondary / standard / high-emphasis), **not** size variants (sm/md/lg).
- `fine.*` is the baseline; `coarse.*` auto-injects under `@media (any-pointer: coarse)`.

Rendered height:

```
rendered = (line-height × font-size) + inset-top + inset-bottom
floor    = max(rendered, semantic.sizing.hit.{min|base|prominent})
```

### Elevation

- **Flat theme:** override `semantic.elevation.surface.*` to use `level.0`/`level.1` for all strata.
- **Deep theme:** override `core.elevation.level` shadow recipes.
- **Invariant:** `flat < raised < overlay < blocking`. Adjacent strata must not resolve to the same shadow.
- **Dark mode:** pair `emphatic` ramp shadows with slightly lighter surface backgrounds (e.g., `neutral.700` instead of `neutral.900` for raised).

### Motion

- **Static theme:** remap all `semantic.motion.*` durations to `'{core.motion.duration.none}'`.
- **Expressive theme:** keep `hover`/`press`/`toggle` < 200ms. Decorative/emphasis may exceed 300ms.
- Override `core.motion.easing.*` for movement character.
- `motion.decorative` must be disabled under `prefers-reduced-motion`.

### Borders

Border tokens define geometry only (width + style). Color comes from the semantic color system.

**Constraints:**

- `core.border.width.selected` > `core.border.width.default`.
- `core.border.width.focused` > `core.border.width.default`.
- The focus ring (`semantic.focus.ring`) is a separate contract. Must be clearly visible on both light and dark surfaces in both modes. Override `semantic.focus.ring.color` if `brand.700` lacks 3:1 contrast against the surface.

### Opacity

Whole-element dimming for scrims, loading states, and visual media. **Not** for text hierarchy or disabled controls.

- Disabled controls → use `semantic.colors.*.*.disabled` tokens.
- Disabled media/assets → `semantic.opacity.disabled` (default `0.5`).
- Rarely override opacity values.

### Breakpoints

**Not themed.** `core.breakpoints.*` is layout infrastructure. Do not override.

---

## Step 5 — Dark Mode Alternate

The alternate is a `ModeOverride`. Core tokens are immutable across modes.

### Order of operations

1. **Surfaces** → `content.primary.background.default: '{core.colors.neutral.900}'`, `secondary: '{core.colors.neutral.700}'`
2. **Text** → `content.primary.text.default: '{core.colors.neutral.0}'`, `secondary: '{core.colors.neutral.50}'`
3. **Brand on dark** → keep `action.primary.background.default: brand.500` if contrast ≥ 4.5:1. Otherwise shift to `brand.300`/`brand.400`.
4. **Feedback text** → shift to `.300` step per hue (lighter, visible on dark surfaces).
5. **Elevation** → remap `semantic.elevation.surface.*` to `emphatic` ramp. Pair with lighter surface backgrounds.
6. **Validate** → every text/background pair must meet WCAG 4.5:1.

**Temperature:** warm theme → `neutral.900 = '#1c1917'` (not `#0f172a`). If base neutrals don't match the dark temperature, override `core.colors.neutral` in `overrides.core`, not in the alternate.

---

## Step 6 — Final Validation Checklist

| Check                                                           | Pass condition                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| White text on `brand.500`                                       | ≥ 4.5:1                                                             |
| White text on `brand.700`                                       | ≥ 4.5:1                                                             |
| `content.primary.text` on `content.primary.background`          | ≥ 4.5:1                                                             |
| `input.primary.border` against `input.primary.background`       | ≥ 3:1                                                               |
| `feedback.{positive\|caution\|negative}` text on its background | ≥ 4.5:1                                                             |
| `action.accent` vs `action.primary`                             | Accent uses contrasting hue or perceptually louder step             |
| Feedback triads colorblind-safe                                 | Positive ≠ caution ≠ negative in both hue AND lightness             |
| Elevation strata order                                          | `flat < raised < overlay < blocking` (no equality)                  |
| Border width order                                              | `default < selected`, `default < focused`                           |
| Hit target order                                                | `min < base < prominent` (compare fine floors; coarse always fixed) |
| `inset.surface` vs `inset.control`                              | `surface ≥ control` at same size step                               |
| `coarse.*` vs `fine.*` hit targets                              | `coarse` fixed value ≥ `fine` clamp floor                           |
| Focus ring on `action.primary.background`                       | Ring color passes 3:1 against bg                                    |
| Focus ring in dark alternate                                    | Same check on dark surfaces                                         |
| All dark alternate text/background pairs                        | ≥ 4.5:1                                                             |
| Spacing engine and typography leading                           | Same direction: compact↔tight, spacious↔relaxed                     |
| Neutral temperature vs brand temperature                        | Same family or achromatic                                           |
| Semantic overrides format                                       | `'{core.path.to.token}'` — no raw hex/px                            |

---

## Override Patterns

### Minimal (brand color only)

```ts
// src/themes/<name>.ts
import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';

const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '...', 100: '...', 200: '...', 300: '...',
          400: '...', 500: '...', 600: '...', 700: '...',
          800: '...', 900: '...',
        },
      },
    },
  },
});

export const <name> = withDataviz(bundle);
```

Inherits all non-color tokens and dark mode from `baseTheme`. Use only for themes that differ in accent color alone.

### Identity (brand + personality)

```ts
const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          /* full palette */
        },
        neutral: {
          /* warm/cool tinted neutrals */
        },
      },
      font: {
        family: { sans: '"YourFont", ui-sans-serif, system-ui, sans-serif' },
      },
      radii: { sm: '2px', md: '4px', lg: '6px', xl: '8px' },
      spacing: { engine: { unit: 'clamp(3px, 0.4cqi + 1.5px, 6px)' } },
    },
    semantic: {
      radii: {
        control: '{core.radii.sm}',
        surface: '{core.radii.md}',
      },
    },
  },
  alternate: {
    semantic: {
      colors: {
        /* dark mode semantic overrides */
      },
      elevation: {
        surface: {
          flat: '{core.elevation.emphatic.0}',
          raised: '{core.elevation.emphatic.2}',
          overlay: '{core.elevation.emphatic.3}',
          blocking: '{core.elevation.emphatic.4}',
        },
      },
    },
  },
});
```

### Inheriting from another theme

```ts
import { corporate } from './corporate';

const bundle = createTheme({
  extends: corporate,
  overrides: {
    core: { colors: { brand: { 500: '#FF6600' } } },
  },
});
```

`extends` inherits `base`, `baseMode`, and `alternate` from the parent automatically.

### File JSDoc template

```ts
/**
 * <Theme Name> theme.
 *
 * Identity axes:
 * - Character: <serious | expressive>
 * - Weight: <delicate | heavy>
 * - Temperature: <cool | warm>
 * - Geometry: <angular | organic>
 * - Density: <compact | spacious>
 *
 * Brand: <one-sentence description of what this theme communicates>
 */
```

---

## Contrast Validation

**WCAG 2.1 formula:**

```
L = 0.2126×R + 0.7152×G + 0.0722×B  (after sRGB linearization)
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

| Text type                                 | Minimum ratio |
| ----------------------------------------- | ------------- |
| Normal text (< 18pt, < 14pt bold)         | 4.5:1         |
| Large text (≥ 18pt or ≥ 14pt bold)        | 3:1           |
| Non-text UI (borders, icons, focus rings) | 3:1           |

---

## Reference: Overridable Token Families

| Layer      | Family                              | Override rationale                                                                                                                               |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core`     | `colors.brand`                      | Primary identity lever. Most impactful.                                                                                                          |
| `core`     | `colors.neutral`                    | Surface temperature. Override for warm/cool theme.                                                                                               |
| `core`     | `colors.[hue]`                      | Only when brand clashes with inherited feedback hues.                                                                                            |
| `core`     | `font.family.sans`                  | Typeface personality.                                                                                                                            |
| `core`     | `font.weight`                       | Weight axis of the entire system.                                                                                                                |
| `core`     | `font.leading`                      | Line height. Compact → `tight`/`snug`. Spacious → `normal`/`relaxed`.                                                                            |
| `core`     | `font.tracking`                     | Letter spacing. Override for custom font metrics.                                                                                                |
| `core`     | `font.scale.text.*`                 | Body text clamp formulas. Tune bounds only.                                                                                                      |
| `core`     | `font.scale.display.*`              | Heading clamp formulas. Tune bounds only.                                                                                                        |
| `core`     | `radii.*`                           | Pixel values of curvature steps.                                                                                                                 |
| `core`     | `spacing.engine.unit`               | Single density knob. Cascades to all spacing. Tune clamp bounds.                                                                                 |
| `core`     | `sizing.ramp.ui.*`                  | Icon/identity object fluid sizing. Tune clamp bounds.                                                                                            |
| `core`     | `sizing.ramp.layout.*`              | Structural width fluid sizing. Tune clamp bounds.                                                                                                |
| `core`     | `sizing.hit.fine.*`                 | Ergonomic floors for mouse. Fine values may use `clamp(floor, preferred, max)` where `floor` is fixed `Npx`. Tune `preferred`/`max` for density. |
| `core`     | `sizing.hit.coarse.*`               | Ergonomic targets for touch. Always fixed `px`. ≥ fine floor counterpart.                                                                        |
| `core`     | `elevation.level.*`                 | Shadow recipes for light mode.                                                                                                                   |
| `core`     | `elevation.emphatic.*`              | Stronger shadow recipes for dark mode.                                                                                                           |
| `core`     | `border.width.*`                    | Line thickness. `selected` and `focused` must be > `default`.                                                                                    |
| `core`     | `motion.duration.*`                 | Animation speed. All `0ms` = static theme.                                                                                                       |
| `core`     | `motion.easing.*`                   | Movement character.                                                                                                                              |
| `core`     | `breakpoints.*`                     | **Not themed.** Do not override.                                                                                                                 |
| `semantic` | `radii.{control\|surface\|round}`   | Which core step each structural shape role maps to.                                                                                              |
| `semantic` | `colors.*`                          | Override only when a core change breaks contrast pairings.                                                                                       |
| `semantic` | `spacing.inset.control.*`           | Control padding. Must be ≤ `inset.surface` at same step.                                                                                         |
| `semantic` | `spacing.inset.surface.*`           | Surface padding. Must be ≥ `inset.control` at same step.                                                                                         |
| `semantic` | `spacing.gap.{stack\|inline}.*`     | Rhythm spacing. Rarely override.                                                                                                                 |
| `semantic` | `elevation.surface.*`               | Which shadow recipe each visual layer uses. Invariant: `flat < raised < overlay < blocking`.                                                     |
| `semantic` | `sizing.hit.{min\|base\|prominent}` | Which core hit step each prominence level maps to. Floor for `min-height`/`min-width`, not size variants.                                        |
| `semantic` | `sizing.icon.*`                     | Icon sizing via fluid ramp.                                                                                                                      |
| `semantic` | `focus.ring.color`                  | Override if brand hue lacks 3:1 on both modes.                                                                                                   |
| `semantic` | `motion.*`                          | Tempo overrides or static profile (all durations → `'{core.motion.duration.none}'`).                                                             |
| `semantic` | `opacity.*`                         | Whole-element dimming. Rarely override.                                                                                                          |
| `semantic` | `text.*`                            | Text style aliases. Rarely override.                                                                                                             |
