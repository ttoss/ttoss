# React Aria Token Mapping & Component Resolution

**Status:** Initial version — design tokens and React Aria component equivalencies for @ttoss/ui2 migration.

---

## Components Migration Table

| Current Component | Current Library | React Aria Equivalent | Token Inheritance | Notes |
|---|---|---|---|---|
| **Button** | Native `<button>` | `Button` from `react-aria` | See [Button Tokens](#button-tokens) | Action component; has consequence support |
| **Input** | `Field.Input` (Ark UI) | `useTextField` hook + native `<input>` | See [Input Tokens](#input-tokens) | Participates in Field context; has invalid overlay |
| **Label** | `Field.Label` (Ark UI) | `Label` from `react-aria` | See [Label Tokens](#label-tokens) | Structure component; fixed `secondary` evaluation |
| **HelperText** | `Field.HelperText` (Ark UI) | Custom wrapper + `aria-describedby` | See [HelperText Tokens](#helpertext-tokens) | Feedback component; fixed `muted` evaluation |
| **ValidationMessage** | `Field.ErrorText` (Ark UI) | Custom wrapper + auto-wiring | See [ValidationMessage Tokens](#validationmessage-tokens) | Feedback component; displays on invalid state |
| **TextField** | Composite (Ark Field) | Custom composite via Field Wrapper | See [TextField Design](#textfield-design) | Assembles Label + Input + HelperText + ValidationMessage |

---

## Token Dependencies by Component

### Button Tokens

**CSS Properties:**
- `color` (text) → resolved via `data-variant` (evaluation + consequence)
- `background-color` → from action tokens
- `border-color` → from action tokens

**Typography:**
- `font-family`: `--tt-text-label-{md|sm|lg}-fontFamily`
- `font-size`: `--tt-text-label-{md|sm|lg}-fontSize`
- `font-weight`: `--tt-text-label-{md|sm|lg}-fontWeight`
- `line-height`: `--tt-text-label-{md|sm|lg}-lineHeight`
- `letter-spacing`: `--tt-text-label-{md|sm|lg}-letterSpacing`

**Layout:**
- `min-height`: `--tt-sizing-hit-{min|base|prominent}` (by size)
- `padding-block`: `--tt-spacing-inset-control-{sm|md|lg}`
- `padding-inline`: `--tt-spacing-inset-control-{sm|md|lg}`
- `border-radius`: `--tt-radii-control`
- `gap`: `--tt-spacing-gap-inline-sm`

**Motion:**
- `transition-duration`: `--tt-motion-feedback-duration`
- `transition-timing-function`: `--tt-motion-feedback-easing`

### Input Tokens

**CSS Properties:**
- `color` (text) → from primary tokens by default
- `background-color` → from primary tokens
- `border-color` → from primary tokens
- `[data-invalid]` overlay → switches to negative role

**Typography:**
- Same as Button (md, sm, lg variants)

**Layout:**
- `min-height`: `--tt-sizing-hit-{min|base|prominent}` (by size)
- `padding-block`: `--tt-spacing-inset-control-{sm|md|lg}`
- `padding-inline`: `--tt-spacing-inset-control-{sm|md|lg}`
- `border-radius`: `--tt-radii-control`

**Focus Ring:**
- `outline-width`: `--tt-focus-ring-width`
- `outline-style`: `--tt-focus-ring-style`
- `outline-color`: `--tt-focus-ring-color`
- `outline-offset`: `2px`

### Label Tokens

**CSS Properties:**
- `color` (text) → secondary evaluation (fixed, not configurable)

**Typography:**
- `font-family`: `--tt-text-label-sm-fontFamily`
- `font-size`: `--tt-text-label-sm-fontSize`
- `font-weight`: `--tt-text-label-sm-fontWeight`
- `line-height`: `--tt-text-label-sm-lineHeight`
- `letter-spacing`: `--tt-text-label-sm-letterSpacing`

**Layout:**
- `margin-bottom`: `--tt-spacing-gap-inline-sm`

**State-dependent (from Field context):**
- `[data-disabled]` → applies disabled color tokens
- `[data-required]` → renders required indicator (::after)

### HelperText Tokens

**CSS Properties:**
- `color` (text) → muted evaluation (fixed, not configurable)

**Typography:**
- `font-family`: `--tt-text-label-sm-fontFamily`
- `font-size`: `--tt-text-label-sm-fontSize`
- `font-weight`: `--tt-text-label-sm-fontWeight`
- `line-height`: `--tt-text-label-sm-lineHeight`
- `letter-spacing`: `--tt-text-label-sm-letterSpacing`

**Layout:**
- `margin-top`: `--tt-spacing-gap-inline-sm`

### ValidationMessage Tokens

**CSS Properties:**
- `color` (text) → negative evaluation (fixed, always error color)
- Initially hidden (`display: none` when no error)
- Visible + animated when `Field.Root` has `invalid={true}`

**Typography:**
- `font-family`: `--tt-text-label-sm-fontFamily`
- `font-size`: `--tt-text-label-sm-fontSize`
- `font-weight`: `--tt-text-label-sm-fontWeight`
- `line-height`: `--tt-text-label-sm-lineHeight`
- `letter-spacing`: `--tt-text-label-sm-letterSpacing`

**Layout:**
- `margin-top`: `--tt-spacing-gap-inline-sm`

---

## TextField Design

**Composite Structure:**
```
<Field.Root {invalid, disabled, required, readOnly}>
  <Label>{label}</Label>
  <Input size={size} />
  <HelperText>{helperText}</HelperText>
  <ValidationMessage>{errorText}</ValidationMessage>
</Field.Root>
```

**Auto-wired ARIA (via Field context):**
- `aria-labelledby` → Label.id
- `aria-describedby` → HelperText.id (and ValidationMessage.id on invalid)
- `aria-invalid` → Field.root.invalid
- `aria-required` → Field.root.required
- `aria-readonly` → Field.root.readOnly

**Visibility Rules:**
- HelperText: visible when NOT invalid
- ValidationMessage: visible when invalid

---

## React Aria Integration Points

### Hook-based vs Component-based

React Aria provides **both** patterns:

1. **Hooks** (low-level, maximum control):
   - `useButton()`, `useTextField()`, `useFocusRing()`
   - Good for wrapping native elements
   - Requires manual ARIA wiring

2. **Components** (high-level, batteries included):
   - `<Button>`, `<TextField>`, `<TextField>` with props
   - Provides full ARIA out-of-the-box
   - Less CSS customization needed

**For ui2 transition:** Use hooks where we need custom styling, components where we need standard behavior.

---

## CSS Architecture Alignment

**Current (Ark UI):**
- `data-scope` = component namespace
- `data-part` = internal structure part (e.g., `root`, `control`)
- `data-variant` = semantic role (from `resolveRole()`)
- `data-size` = size variant
- `[data-state='...']` = interactive states

**React Aria:**
- Provides similar data attributes out-of-the-box
- `data-focus`, `data-hover`, `data-active`, `data-disabled`, `data-invalid`
- Additional context via `aria-*` attributes (not styling)

**Migration strategy:**
- Keep existing `data-scope`, `data-variant`, `data-size` pattern
- React Aria provides state attributes (`data-disabled`, `data-invalid`)
- Minimal CSS rewrite needed if we wrap React Aria hooks

---

## Open Questions / TODO

- [ ] Confirm React Aria Field pattern matches Ark UI behavior
- [ ] Test focus ring customization with React Aria
- [ ] Validate keyboard shortcuts and interaction model
- [ ] Check internationalization vs `@ttoss/theme2`
- [ ] Performance profile vs Ark UI baseline
- [ ] Bundle size impact
