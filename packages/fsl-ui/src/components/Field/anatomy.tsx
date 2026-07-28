import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  FieldError as RACFieldError,
  type FieldErrorProps as RACFieldErrorProps,
  Label as RACLabel,
  type LabelProps as RACLabelProps,
  Text as RACText,
  type TextProps as RACTextProps,
} from 'react-aria-components';

import { type FslKnob, fslVar, upstreamVar } from '../../tokens/escapeHatch';
import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Shared anatomy of a field.
//
// Nothing here is exported from the package: this is the geometry source the
// Input-entity components read, the counterpart of `ActionTrigger/anatomy.tsx`
// for the Action family.
//
// Every field has the same envelope — root ▸ label ▸ control ▸ description ▸
// validationMessage — and the control sits on the **field row**: `sizing.hit`
// as the ergonomic floor, `inset.control` for the insets, `text.label.md` for
// the type. A utility Action trigger shares that row on purpose (contract
// invariant "utility triggers share the field row"), which is why the row is
// one decision and not a per-component tune.
//
// Two shapes of control exist, and the difference is not cosmetic:
//
//   *self-painted* — one element is both the painted box and the thing the
//   user operates (`TextField`'s `<input>`, `TextArea`'s `<textarea>`,
//   `Select`'s trigger). Use `buildFieldControlStyle`.
//
//   *split* — a frame paints and hosts adornments while a borderless inner
//   input carries the value (`NumberField`, `ComboBox`, `SearchField`). Use
//   `buildFieldFrameStyle` + `buildFieldValueStyle`. `data-part="control"`
//   stays on the **operated** element (the input), because that is what makes
//   the anatomy addressable — a test or an agent told to type into a field
//   resolves `[data-part="control"]` and must be able to type into it. The
//   frame is an internal part (`data-part="frame"`), the same treatment
//   Slider's `track`/`fill` already get (ADR-008).
//
// Copying these declarations per component is how the drift measured across
// the family got in: a control that wrote `minBlockSize` where its siblings
// wrote `minHeight`, a focus ring floated on four members and flush on two,
// and two host-element UA defaults nobody had declared (a `<button>` centring
// its value, an `<input>` keeping its 2px inline padding).
// ---------------------------------------------------------------------------

type InputColors = typeof vars.colors.input.primary;

/**
 * The field row. Every field control resolves its box from exactly these four
 * tokens, so the row is one decision — and a utility Action trigger reads the
 * same set from `UTILITY_SILHOUETTE`.
 */
export const FIELD_ROW = {
  /** Corner radius of the painted box. */
  radius: vars.radii.control,
  /** Composite text style (spread into the style object). */
  text: vars.text.label.md as React.CSSProperties,
  /** Block (vertical) inset. */
  insetBlock: vars.spacing.inset.control.sm,
  /** Inline (horizontal) inset. */
  insetInline: vars.spacing.inset.control.md,
} as const;

/** Render-prop flags a field's chrome resolves colour from. */
export interface FieldChromeFlags {
  isHovered?: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
  isInvalid?: boolean;
}

/**
 * The colour triple a field's chrome paints, resolved through the canonical
 * cascade. Split out so the frame and a self-painted control cannot disagree
 * about which flags feed which dimension: `background` and `text` never react
 * to focus (the ring carries it), and `border` never reacts to hover on a
 * dimension that already has a focus colour.
 */
const resolveFieldChrome = (colors: InputColors, flags: FieldChromeFlags) => {
  const { isHovered, isDisabled, isFocusVisible, isInvalid } = flags;

  return {
    backgroundColor: resolveInteractiveStyle(colors?.background, {
      isHovered,
      isDisabled,
      isInvalid,
    }),
    borderColor: resolveInteractiveStyle(colors?.border, {
      isDisabled,
      isInvalid,
      isFocusVisible,
    }),
    color:
      resolveInteractiveStyle(colors?.text, {
        isHovered,
        isDisabled,
        isInvalid,
      }) ?? colors?.text?.default,
  };
};

/** The box, border, motion and focus ring shared by every painted field box. */
const fieldBoxChrome = (
  colors: InputColors,
  flags: FieldChromeFlags
): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    borderRadius: FIELD_ROW.radius,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    transitionProperty: 'background-color, border-color, color',
    ...resolveFieldChrome(colors, flags),
    outline: focusRingOutline(flags.isFocusVisible),
    outlineOffset: FOCUS_RING_OFFSET,
  };
};

/**
 * A **self-painted** field control: the painted box and the operated element
 * are the same node.
 *
 * `textAlign` is declared rather than inherited on purpose. A field's job is
 * to display a value at the reading edge, and the host element's UA default
 * decides that when nothing else does — an `<input>` starts its text, a
 * `<button>` centres it. Stating it here is what keeps a Select trigger's
 * value on the same edge as a TextField's.
 *
 * @param multiline - a `<textarea>` grows past the row by rows; the row's
 *   floor still applies, and the caller adds its own `resize`.
 */
export const buildFieldControlStyle = ({
  colors,
  multiline,
  ...flags
}: FieldChromeFlags & {
  colors: InputColors;
  multiline?: boolean;
}): React.CSSProperties => {
  return {
    ...fieldBoxChrome(colors, flags),
    // `hit` is the ergonomic floor, never the visible height: the box comes
    // out of inset + type, with `hit` guaranteeing the minimum (ADR-020).
    // Declared through `minHeight` on every member — a sibling that wrote
    // `minBlockSize` computed the same box but was invisible to the row guard.
    minHeight: vars.sizing.hit,
    paddingBlock: FIELD_ROW.insetBlock,
    paddingInline: FIELD_ROW.insetInline,
    textAlign: 'start',
    ...(multiline ? { resize: 'vertical' } : {}),
    ...FIELD_ROW.text,
  } as React.CSSProperties;
};

/**
 * The **frame** of a split control: it paints the field box and hosts the
 * adornments, while the value lives in a borderless inner input.
 *
 * It carries no inset of its own — the inner value and the adornments own the
 * inline space, so a frame that also padded would double the gap on the
 * reading edge.
 *
 * It *does* carry the row's type, though it renders no text itself. Measured:
 * without it the same `ComboBox` frame resolved `16px` in Storybook and `18px`
 * inside the Studio's invite dialog, because a frame that declares nothing
 * inherits the host's paragraph size — and anything placed inside it inherits
 * that in turn. A self-painted control never had the problem: the row's type is
 * part of the box it declares. The frame is the shape that could drift, so the
 * declaration belongs here rather than in the components.
 */
export const buildFieldFrameStyle = ({
  colors,
  ...flags
}: FieldChromeFlags & { colors: InputColors }): React.CSSProperties => {
  return {
    ...fieldBoxChrome(colors, flags),
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: vars.sizing.hit,
    ...FIELD_ROW.text,
  } as React.CSSProperties;
};

/**
 * The **value** of a split control: the borderless input inside a frame. It
 * takes the row's insets so its text lands exactly where a self-painted
 * control's text does, and it declares `textAlign` for the same reason
 * `buildFieldControlStyle` does.
 */
export const buildFieldValueStyle = ({
  colors,
  textAlign = 'start',
}: {
  colors: InputColors;
  /**
   * Reading edge of the value. `start` everywhere except where the value is a
   * fixed-width figure whose digits should sit under each other.
   */
  textAlign?: 'start' | 'center';
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 0,
    border: 0,
    background: 'transparent',
    outline: 'none',
    paddingBlock: FIELD_ROW.insetBlock,
    paddingInline: FIELD_ROW.insetInline,
    textAlign,
    color: colors?.text?.default,
    ...FIELD_ROW.text,
  } as React.CSSProperties;
};

/**
 * The envelope: label, control, description and validation message stacked in
 * one column. Block-level, so a field fills the column it is placed in —
 * a field that sized to its content would leave a form row ragged.
 */
export const buildFieldRootStyle = (): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.gap.stack.xs,
  };
};

/**
 * A text part of the envelope — the label, the description, or the validation
 * message.
 *
 * `tone` is derived from the field's State, never chosen by an author:
 * `negative` is what the `invalid` State looks like on copy (ADR-017). The
 * label reads `md` because it names the control; supporting copy reads `sm`.
 *
 * **`negative` currently resolves to the same ink as `neutral`, and that is not
 * an oversight here.** `input.primary.text.invalid` is deliberately the
 * *control's* readable-value colour, so the valence lives on the border alone:
 * measured on the `Invalid` story at 1280px, the message resolves
 * `rgb(22,22,22)` in light and `rgb(255,255,255)` in dark — byte-identical to
 * the label beside it — while the border carries `rgb(220,38,38)` /
 * `rgb(252,165,165)`. The parameter is the shape the validation language needs
 * (F-032, and the second half of F-009); the token it should read arrives with
 * that decision, and this signature is why it will be a one-line change.
 */
export const buildFieldTextPartStyle = ({
  colors,
  step,
  tone = 'neutral',
}: {
  colors: InputColors;
  step: 'md' | 'sm';
  tone?: 'neutral' | 'negative';
}): React.CSSProperties => {
  const text = colors?.text;

  return {
    color:
      tone === 'negative' ? (text?.invalid ?? text?.default) : text?.default,
    ...((step === 'md'
      ? vars.text.label.md
      : vars.text.label.sm) as React.CSSProperties),
  } as React.CSSProperties;
};

// ---------------------------------------------------------------------------
// The two ways to author a field
//
// The family had three shapes for one idea: `TextField`/`TextArea`/`SearchField`
// composed by slots, `Select`/`ComboBox`/`NumberField` took props, and `Select`
// had nowhere to render a message at all (F-009). Both shapes are legitimate —
// one line for the common field, slots when the arrangement is unusual — so the
// fix is not to pick one but to make every field support both, from one code
// path, with the combination that has no meaning rejected at compile time.
// ---------------------------------------------------------------------------

/**
 * Copy the envelope renders in a field's **one-line** form. Everything here is
 * caller-supplied (ADR-001): the package ships no default label, hint or
 * message copy in any language.
 */
export interface FieldCopyProps {
  /** Visible label naming the control. */
  label?: React.ReactNode;
  /** Hint text — what to enter, or a constraint worth stating up front. */
  description?: React.ReactNode;
  /**
   * Validation message. Rendered only while the field is invalid (React Aria's
   * `FieldError` behaviour). Omit it and the browser's own constraint message
   * is shown instead, which is usually the better default for `isRequired`
   * and `type="email"`.
   */
  errorMessage?: React.ReactNode;
  /** Placeholder on the control. Never a substitute for `label`. */
  placeholder?: string;
}

/**
 * A field is authored **either** in its one-line form (copy as props) **or** by
 * composing its slots — never both, because there would be no answer to which
 * label wins. Expressed as a discriminated union so `tsc` rejects the mix
 * instead of a runtime precedence rule deciding it silently (the ADR-001
 * mechanism, as used by `ActionLabellingProps`).
 */
export type FieldAuthoring<TChildren> =
  | ({ children: TChildren } & { [K in keyof FieldCopyProps]?: never })
  | (FieldCopyProps & { children?: undefined });

// ---------------------------------------------------------------------------
// Field layout — published by the Form, read by the fields
//
// Label layout and the necessity convention are one product decision, not a
// per-field one: a form where some labels sit above and others beside, or where
// one field marks required and the next does not, is a form nobody proofread.
// So the `Form` publishes it and every field reads it — the ecosystem's pattern
// (apps configure at the root, packages consume context, never a style prop),
// and the same shape `ActionTriggerGroupProvider` uses for the one thing a group
// imposes on its triggers.
//
// Read with a **default** rather than through the Form's presence scope, because
// a field outside any Form is a first-class case (a lone age input, a
// confirmation checkbox in a modal) and must not throw. `formScope.use()` still
// throws for the parts that genuinely require the host — `FormActions`,
// `FormSubmit`.
//
// **Static configuration only.** This is a plain React context, so a value that
// changed per keystroke would re-render every field in the form. (TanStack Form
// can keep field state in context because its values are static class instances
// with reactive properties; ours are not, and the difference is load-bearing.)
// Validation state stays on each field, where React Aria already tracks it.
// ---------------------------------------------------------------------------

/**
 * How a form marks the fields the user must fill.
 *
 * - `icon` — an asterisk beside the label. The reference system's default, and
 *   the web's convention: it marks the *required* fields, not the optional ones.
 * - `none` — no visual marker. Screen readers still hear the requirement: React
 *   Aria marks the control with the **native `required` attribute** (verified —
 *   `required=""`, and it sets no `aria-required`), which AT announces on its own.
 *
 * A `label` variant (the words "(required)") is deliberately absent: it is copy,
 * and copy is caller-supplied (ADR-001) — we cannot ship a translated string.
 * Readmission criterion: a consumer that needs it, plus a prop to carry its
 * localized text.
 */
export type FieldNecessityIndicator = 'icon' | 'none';

/** Layout decisions a Form makes once on behalf of its fields. */
export interface FieldLayout {
  /** How required fields are marked. */
  necessityIndicator: FieldNecessityIndicator;
}

/**
 * What a field assumes when nothing published a layout — a field standing on
 * its own still marks itself required, because the marker belongs to the field's
 * meaning rather than to the form's chrome.
 */
const FIELD_LAYOUT_DEFAULT: FieldLayout = {
  necessityIndicator: 'icon',
};

const FieldLayoutContext =
  React.createContext<FieldLayout>(FIELD_LAYOUT_DEFAULT);
FieldLayoutContext.displayName = 'FieldLayoutContext';

/** Publishes a Form's layout decisions to the fields inside it. */
export const FieldLayoutProvider = FieldLayoutContext.Provider;

/** The active layout, or the standalone default when no Form published one. */
export const useFieldLayout = (): FieldLayout => {
  return React.useContext(FieldLayoutContext);
};

/**
 * The necessity marker, or nothing.
 *
 * `aria-hidden`, because the control already carries the native `required`
 * attribute — announcing it twice is noise, and an asterisk absorbed into the
 * accessible name is worse than no asterisk at all.
 * Rendered as text rather than as an `Icon` so the glyph registry does not grow
 * for a character every font already has, and so it inherits the label's size
 * and weight for free.
 */
export const FieldNecessityMarker = ({
  isRequired,
}: {
  isRequired?: boolean;
}) => {
  const { necessityIndicator } = useFieldLayout();

  if (isRequired !== true || necessityIndicator === 'none') return null;

  return (
    <span
      aria-hidden
      data-part="necessityMarker"
      style={{ marginInlineStart: vars.spacing.gap.inline.xs }}
    >
      *
    </span>
  );
};

// ---------------------------------------------------------------------------
// The envelope parts — one implementation, each component's own scope
//
// A field's label, description and validation message are the same three
// elements everywhere: a RAC context consumer, the published `(data-scope,
// data-part)` pair, and a text step from `buildFieldTextPartStyle`. Nine
// components had written that out by hand, and the drift it produced was
// measured before this existed: the necessity marker reached **three** of the
// nine roots that accept `isRequired`, two roots had nowhere to render a message
// at all (F-009 on `Select`, the same shape on `RadioGroup`), and three files
// carried a private `resolveFieldTextColors` helper computing what the anatomy
// already computes.
//
// These take `scope` as a prop rather than owning one, which is the difference
// between them and the generic exported `FieldLabel` that item A **rejected**:
// nothing a caller can address changes. `text-field/label` is still
// `text-field/label`, so the published attributes — the contract a test or an
// agent queries — are byte-identical either side of this refactor. What
// collapses is the copy behind them. They are internal, like every other part
// of this module: the composable surface stays the per-component slot exports
// (`TextFieldLabel` and its siblings), which now render through these.
//
// Emptiness stays the caller's decision, not the part's. A description that is
// absent renders nothing at the call site; a validation message is **always
// mounted**, because React Aria's `FieldError` with no children is what shows
// the platform's own localized constraint copy — the better message for
// `isRequired` and `type="email"`, and copy ADR-001 forbids us to ship.
// ---------------------------------------------------------------------------

/** What every envelope part needs: the host's identity and its colour set. */
interface FieldEnvelopePart {
  /**
   * The host component's published `data-scope`. Passed in rather than owned so
   * this refactor changes no addressable attribute (see the note above).
   */
  scope: string;
  /** The field's colour set — `input.primary` for every field today. */
  colors: InputColors;
}

/** Props for the shared label part. */
export type FieldLabelPartProps = Omit<
  RACLabelProps,
  'style' | 'className' | 'slot'
> &
  FieldEnvelopePart & {
    /**
     * Whether the field must be filled — drives the necessity marker.
     *
     * Hosts that already render through React Aria's render props pass the
     * value from there; the rest pass their own prop. The two are the same
     * value: RAC derives the render-prop flag as `props.isRequired || false`
     * (read in `Select.mjs`), and the envelope guard asserts the marker from the
     * prop on every member of the family.
     */
    isRequired?: boolean;
  };

/**
 * The label of a field, with the necessity marker beside its text.
 *
 * The marker is inside the label because it must sit with the words it
 * qualifies, and it is `aria-hidden` for the reason recorded on
 * `FieldNecessityMarker`.
 */
export const FieldLabelPart = ({
  scope,
  colors,
  isRequired,
  children,
  ...props
}: FieldLabelPartProps) => {
  return (
    <RACLabel
      {...props}
      data-scope={scope}
      data-part="label"
      style={buildFieldTextPartStyle({ colors, step: 'md' })}
    >
      {children}
      <FieldNecessityMarker isRequired={isRequired} />
    </RACLabel>
  );
};

/** Props for the shared description part. */
export type FieldDescriptionPartProps = Omit<
  RACTextProps,
  'style' | 'className' | 'slot'
> &
  FieldEnvelopePart;

/**
 * Hint text under the control, linked to it by React Aria's `description` slot
 * (which is what puts it in `aria-describedby`).
 */
export const FieldDescriptionPart = ({
  scope,
  colors,
  ...props
}: FieldDescriptionPartProps) => {
  return (
    <RACText
      slot="description"
      {...props}
      data-scope={scope}
      data-part="description"
      style={buildFieldTextPartStyle({ colors, step: 'sm' })}
    />
  );
};

/** Props for the shared validation-message part. */
export type FieldValidationMessagePartProps = Omit<
  RACFieldErrorProps,
  'style' | 'className'
> &
  FieldEnvelopePart;

/**
 * The validation message. React Aria renders it only while the field is
 * invalid, and falls back to the platform's own constraint copy when given no
 * children — so mount it unconditionally and pass the caller's `errorMessage`
 * straight through.
 */
export const FieldValidationMessagePart = ({
  scope,
  colors,
  ...props
}: FieldValidationMessagePartProps) => {
  return (
    <RACFieldError
      {...props}
      data-scope={scope}
      data-part="validationMessage"
      style={buildFieldTextPartStyle({ colors, step: 'sm', tone: 'negative' })}
    />
  );
};

// ---------------------------------------------------------------------------
// The picker popover — the list a field opens, sized to the field row
//
// A picker's popover is part of the field's geometry, not a free-floating
// overlay: it is the same value the row displays, shown as a list. So it takes
// the row's width, and both authorities say so in the same words. React Aria's
// own `Select` and `ComboBox` examples style their popovers
// `width: var(--trigger-width)`; Spectrum 2's `Picker` and `ComboBox` document
// `menuWidth` as "By default, matches width of the trigger. Note that the
// minimum width of the dropdown is always equal to the trigger's width."
//
// Both draw the same line at the same place, and it is worth stating because it
// is the reason this is not simply "make overlays match their triggers":
// **a menu is not a picker.** React Aria's `Menu` example sets no width, S2's
// `Menu` has no `menuWidth`, and neither should — a menu is a list of actions
// that sizes to its own content, so ours keeps its `--fsl-menu-min-width`. The
// distinction is what the popover shows: a picker shows the field's value space,
// a menu shows things to do.
//
// Measured before this existed, in Chromium at 1280 and 390, light and dark:
// `Select`'s popover came out 102.11px under a 1200px trigger and 79.61px under
// 310px, `ComboBox`'s 142.88px and 115.27px — while `--trigger-width` was
// published on the popover the whole time and read by nobody (F-019). `Menu`
// measured 192px from its own knob against a 108.88px trigger, which is correct
// and stays.
// ---------------------------------------------------------------------------

/** Chrome of a picker's popover surface. */
const pickerPopoverChrome = (colors: InputColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    borderRadius: vars.radii.control,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    borderColor: colors?.border?.default,
    backgroundColor: colors?.background?.default,
    overflow: 'hidden',
  };
};

/**
 * The popover a picker opens: the field's chrome, at the field's width.
 *
 * `minWidth` is the floor S2 states as unconditional, so the knob can widen the
 * list for long options but can never make it narrower than the row it belongs
 * to — a dropdown narrower than its own trigger reads as a rendering fault.
 * Neither read may be inverted into a write: React Aria stops observing the
 * trigger the moment `--trigger-width` is supplied (ADR-023).
 *
 * @param widthKnob - host knob that may widen the list past the row.
 */
export const buildPickerPopoverStyle = ({
  colors,
  widthKnob,
}: {
  colors: InputColors;
  widthKnob: FslKnob;
}): React.CSSProperties => {
  // `auto` is the pre-F-019 behaviour — sizing to content — so a popover that
  // somehow renders without the property degrades instead of collapsing.
  const triggerWidth = upstreamVar('--trigger-width', 'auto');

  return {
    ...pickerPopoverChrome(colors),
    minWidth: triggerWidth,
    width: fslVar(widthKnob, triggerWidth),
  };
};

/**
 * The scrolling list inside a picker's popover.
 *
 * @param maxHeightKnob - present when the option set can outgrow the viewport;
 *   omitted where the set is short enough to render whole.
 */
export const buildPickerListStyle = ({
  maxHeight,
}: {
  maxHeight?: string;
} = {}): React.CSSProperties => {
  return {
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    padding: vars.spacing.inset.control.md,
    gap: vars.spacing.gap.stack.xs,
    ...(maxHeight === undefined
      ? {}
      : { maxHeight, overflowY: 'auto' as const }),
  };
};
