/**
 * Coerce any authored colour value to a 6-digit hex for `<input type="color">`.
 *
 * The native colour input accepts **only** a `#rrggbb` literal — it cannot
 * render a CSS `var()`, a token ref, or a shorthand. This returns the value
 * when it is already a valid 6-digit hex, and a safe `#000000` otherwise, so
 * the swatch always shows something while the paired text field keeps the real
 * authored value.
 *
 * The literal fallback lives here — not in a component — because it is a
 * browser-API constraint, not a design colour (component sources read colour
 * only via `vars.colors.*`).
 */
export const forColorInput = (value: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
};
