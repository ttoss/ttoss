/**
 * `fill-extrusion-color` ignores a colour's alpha, and MapLibre keeps colours
 * premultiplied by it: a translucent `rgba(33, 113, 181, 0.3)` would reach the
 * prisms as a near-black `(10, 34, 54)` instead of a see-through blue. So an
 * extruded layer takes its colours opaque, and their alpha as the layer's
 * `fill-extrusion-opacity`, the one opacity an extrusion has.
 */

/** A colour split into its opaque form and its alpha. */
interface SplitColor {
  opaque: string;
  alpha: number;
}

const clampAlpha = (value: number) => {
  return Math.min(1, Math.max(0, value));
};

/** An alpha as CSS writes it: a number, or a percentage. */
const parseAlpha = (raw: string) => {
  const text = raw.trim();
  const value = parseFloat(text);
  if (!Number.isFinite(value)) return undefined;
  return clampAlpha(text.endsWith('%') ? value / 100 : value);
};

const FUNCTIONAL =
  /^(rgba?|hsla?)\(\s*([^,/\s]+)[\s,]+([^,/\s]+)[\s,]+([^,/\s)]+)\s*(?:[,/]\s*([^)\s]+)\s*)?\)$/i;

/** `#rgba` or `#rrggbbaa`: the alpha's hex digits, or none. */
const HEX_ALPHA = /^#(?:[0-9a-f]{3}([0-9a-f])|[0-9a-f]{6}([0-9a-f]{2}))$/i;

/**
 * Splits a CSS colour with an alpha into its opaque form and that alpha; a
 * colour without one — or a string that is no colour — is left alone.
 *
 * @param color - A CSS colour string.
 * @returns The split colour, or `undefined` when it carries no alpha.
 *
 * @example
 * splitColorAlpha('rgba(33, 113, 181, 0.3)'); // { opaque: 'rgb(33, 113, 181)', alpha: 0.3 }
 * splitColorAlpha('#2171b5'); // undefined
 */
export const splitColorAlpha = (color: string): SplitColor | undefined => {
  const functional = FUNCTIONAL.exec(color.trim());
  if (functional) {
    const [, name, x, y, z, rawAlpha] = functional;
    if (rawAlpha === undefined) return undefined;
    const alpha = parseAlpha(rawAlpha);
    if (alpha === undefined) return undefined;
    const base = name.toLowerCase().startsWith('hsl') ? 'hsl' : 'rgb';
    return { opaque: `${base}(${x}, ${y}, ${z})`, alpha };
  }
  const hex = HEX_ALPHA.exec(color.trim());
  if (hex) {
    const digits = hex[1] ? hex[1] + hex[1] : hex[2];
    const opaque = hex[1] ? color.trim().slice(0, 4) : color.trim().slice(0, 7);
    return { opaque, alpha: parseInt(digits, 16) / 255 };
  }
  return undefined;
};

/**
 * Walks a paint value — a colour, or an expression holding colours — making
 * every colour opaque and collecting the alphas it dropped.
 */
const stripAlphas = (value: unknown, alphas: number[]): unknown => {
  if (typeof value === 'string') {
    const split = splitColorAlpha(value);
    if (!split) return value;
    alphas.push(split.alpha);
    return split.opaque;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => {
      return stripAlphas(entry, alphas);
    });
  }
  return value;
};

/**
 * The colour and opacity an extruded layer is painted with: its colours
 * opaque, and their alpha folded into `fill-extrusion-opacity`.
 *
 * The opacity comes from the colours that declare an alpha — an app that
 * fades its classes writes it into every class colour — so a colour without
 * one (a no-data grey, say) does not cancel it, and a fully transparent one
 * (alpha 0) says "draw nothing", not "draw fainter". When the alphas
 * disagree, the most opaque one sets the layer's: an extrusion has one
 * opacity for the whole layer.
 *
 * @param color - The flat layer's `fill-color` value.
 * @param fillOpacity - The layer's own `fillOpacity`, multiplied in.
 * @returns The `fill-extrusion-color` and `fill-extrusion-opacity` values.
 *
 * @example
 * extrusionColorAndOpacity({
 *   color: ['step', ['feature-state', 'value'], 'rgba(0, 0, 255, 0.5)', 10, 'rgba(255, 0, 0, 0.5)'],
 *   fillOpacity: 1,
 * });
 * // { color: ['step', …, 'rgb(0, 0, 255)', 10, 'rgb(255, 0, 0)'], opacity: 0.5 }
 */
export const extrusionColorAndOpacity = ({
  color,
  fillOpacity = 1,
}: {
  color: unknown;
  fillOpacity?: number;
}): { color: unknown; opacity: number } => {
  const alphas: number[] = [];
  const opaque = stripAlphas(color, alphas);
  const visible = alphas.filter((alpha) => {
    return alpha > 0;
  });
  const alpha = visible.length > 0 ? Math.max(...visible) : 1;
  return { color: opaque, opacity: clampAlpha(fillOpacity * alpha) };
};
