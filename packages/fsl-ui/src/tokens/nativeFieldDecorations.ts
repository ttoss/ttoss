/**
 * Suppression of the **user agent's own in-field controls** on any control
 * this package paints.
 *
 * ## The defect this exists to fix
 *
 * A field in this package is a *frame* that owns its interior: the anatomy
 * puts the leading glyph, the invalid mark, the clear button and the steppers
 * inside it (`ICON_SLOT_STYLE`, `FieldInvalidGlyph`, `EMBEDDED_TRIGGER`). The
 * `<input>` inside that frame is borderless and carries the value only.
 *
 * But an `<input>` also brings controls of its own, decided by its `type` and
 * drawn by the browser into the same box — and nothing reconciled the two. On
 * `SearchField`, whose input is `type="search"` (React Aria's `useSearchField`
 * sets it), Chromium paints `::-webkit-search-cancel-button` beside the clear
 * button the anatomy already drew: **two ✕ in the trailing corner**, one of
 * them in the UA's colour, neither aware of the other.
 *
 * ## Why it is a stylesheet and not an inline style
 *
 * These controls are shadow pseudo-elements, and a pseudo-element cannot be
 * addressed from a `style` object — which is the only styling channel every
 * other rule in this package uses. So the reset takes the one mechanism the
 * package already has for CSS that inline styles cannot express, the
 * `ensureKeyframes()` pattern: a single `<style>` injected once per document,
 * SSR-safe and idempotent.
 *
 * It is a **separate** module and a separate element from `keyframes.ts` on
 * purpose. That module's contents are governed by a name registry
 * (`ANIMATION_NAMES`, contract invariant #8) that has nothing to say about
 * this; folding a UA reset into it would put two unrelated invariants behind
 * one export. Only the content-agnostic injection plumbing is shared
 * (`stylesheetInjection.ts`) — id, CSS and the invariants they answer to
 * stay with their owners.
 *
 * ## What is suppressed, and what deliberately is not
 *
 * Only decorations that **duplicate an adornment the anatomy draws**:
 *
 * | pseudo-element                     | duplicates                        |
 * | ---------------------------------- | --------------------------------- |
 * | `::-webkit-search-cancel-button`   | the clear button (`SearchField`)  |
 * | `::-webkit-search-decoration`      | the leading `action.search` glyph |
 * | `::-webkit-search-results-button`  | the leading glyph (legacy WebKit) |
 *
 * Everything else the UA supplies is left alone, because it is the *only*
 * affordance for its type and removing it would take away function rather
 * than a duplicate: `::-webkit-calendar-picker-indicator` on a `type="date"`
 * field (measured — it renders, and this package ships no date picker to
 * replace it), the spin buttons on `type="number"`, the reveal button on
 * `type="password"`. A component that grows its own version of one of those
 * adds a row to the table above; until then the browser's is the one the user
 * gets.
 *
 * ## Why it is type-agnostic rather than scoped to `SearchField`
 *
 * `SearchField` is the only component that carries a decorated type *today* —
 * measured in Chromium: `search-field` renders `type="search"`, while
 * `NumberField` is `type="text"` with `inputmode="numeric"` (React Aria draws
 * its own spinbutton semantics, so the native steppers never appear) and
 * `TextField`/`ComboBox` are `type="text"`. But `TextField` passes a caller's
 * `type` straight through to the input, so `<TextField type="search">` is the
 * same defect one prop away. Keying the reset to the *part* rather than to a
 * component means the next field to acquire a decorated type is already
 * covered — which is the difference between fixing this bug and fixing this
 * instance of it.
 *
 * The consequence is stated rather than hidden: a `TextField type="search"`
 * has no clear button at all, because the anatomy does not draw one there.
 * That is the intended reading — a search box is `SearchField`, which brings
 * the affordance the anatomy owns.
 */

import { injectStylesheetOnce } from './stylesheetInjection';

const STYLE_ELEMENT_ID = 'fsl-ui-native-field-decorations';

/**
 * The stylesheet injected by {@link ensureNativeFieldDecorationReset}.
 *
 * The selector is the package's own attribute contract (CONTRACT §5): every
 * rendered element carries `data-scope` and `data-part`, and a field's value
 * element is always `data-part="control"`. Both attributes sit on the same
 * element, so the compound selector matches this package's controls and
 * nothing an application happens to name the same way under a different
 * scope.
 *
 * `display: none` alone is enough in current Chromium; `appearance: none` is
 * kept beside it because it is what older WebKit answers to, and the two
 * together are the long-standing spelling of this reset.
 */
export const NATIVE_FIELD_DECORATION_CSS = `
[data-scope][data-part='control']::-webkit-search-cancel-button,
[data-scope][data-part='control']::-webkit-search-decoration,
[data-scope][data-part='control']::-webkit-search-results-button {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}
`.trim();

/**
 * Injects the reset into `document.head` exactly once.
 *
 * No-op on the server (SSR-safe) and when the element already exists — two
 * copies of the package on one page share the first copy's stylesheet, the
 * same contract `ensureKeyframes` holds. Both guarantees come from the
 * shared {@link injectStylesheetOnce} mechanism.
 *
 * Called from `buildFieldValueStyle`, which is the one place every field
 * control in the package passes through. A per-component call would be one
 * more thing to remember on the next field, and forgetting it is exactly the
 * bug.
 */
export const ensureNativeFieldDecorationReset = (): void => {
  injectStylesheetOnce({
    id: STYLE_ELEMENT_ID,
    css: NATIVE_FIELD_DECORATION_CSS,
  });
};
