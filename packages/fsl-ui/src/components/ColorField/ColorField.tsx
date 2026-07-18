import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';
import { forColorInput } from '../../tokens/forColorInput';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row: colours `input`, radii `control`,
// border `outline.control`, sizing `hit`, spacing `inset.control`, typography
// `label`. ColorField is the colour-entry control: a native colour swatch and
// a hex text field bound to the same value, so a colour can be picked visually
// or typed. It reads no interactive State beyond the native inputs' own.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ColorField root (Input entity, colour entry). */
export const colorFieldMeta = {
  displayName: 'ColorField',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Props for the ColorField component. */
export interface ColorFieldProps {
  /**
   * Accessible base name for the control — the swatch and hex inputs derive
   * `"{label} color"` / `"{label} hex"` from it. Required: a colour entry with
   * no name is unusable to assistive tech.
   */
  label: string;
  /** The current colour, as authored (a hex like `#0469E3`, or any string). */
  value: string;
  /** Called with the new value when either the swatch or the hex text changes. */
  onChange: (value: string) => void;
  /** Optional id for the hex text input (for an external `<label htmlFor>`). */
  id?: string;
}

/**
 * A colour-entry control — a native swatch plus a hex text field, one value.
 *
 * Entity = Input. Use it wherever a colour must be picked visually or typed
 * (theme editors, token tables). Both inputs edit the same `value`; the swatch
 * coerces to a valid 6-digit hex while the text field accepts any authored
 * string (so a `{ref}` or shorthand isn't clobbered). Colours come from the
 * `input` palette.
 *
 * @example
 * ```tsx
 * <ColorField
 *   label="brand 500"
 *   value={value}
 *   onChange={(v) => setToken(path, v)}
 * />
 * ```
 */
export const ColorField = ({ label, value, onChange, id }: ColorFieldProps) => {
  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      data-scope="color-field"
      data-part="root"
      style={
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: vars.spacing.gap.inline.sm,
        } as React.CSSProperties
      }
    >
      <input
        type="color"
        data-part="swatch"
        aria-label={`${label} color`}
        value={forColorInput(value)}
        onChange={handle}
        style={
          {
            inlineSize: vars.sizing.hit,
            blockSize: vars.sizing.hit,
            padding: 0,
            borderRadius: vars.radii.control,
            borderWidth: vars.border.outline.control.width,
            borderStyle: vars.border.outline.control.style,
            borderColor: vars.colors.input.primary.border?.default,
            background: 'none',
            cursor: 'pointer',
          } as React.CSSProperties
        }
      />
      <input
        type="text"
        id={id}
        data-part="control"
        aria-label={`${label} hex`}
        value={value}
        onChange={handle}
        style={
          {
            minInlineSize: 0,
            paddingBlock: vars.spacing.inset.control.sm,
            paddingInline: vars.spacing.inset.control.md,
            borderRadius: vars.radii.control,
            borderWidth: vars.border.outline.control.width,
            borderStyle: vars.border.outline.control.style,
            borderColor: vars.colors.input.primary.border?.default,
            color: vars.colors.input.primary.text?.default,
            backgroundColor: vars.colors.input.primary.background?.default,
            fontVariantNumeric: 'tabular-nums',
            ...(vars.text.label.sm as React.CSSProperties),
          } as React.CSSProperties
        }
      />
    </div>
  );
};
ColorField.displayName = colorFieldMeta.displayName;
