/*
 * The geovis-workspace palette, as its left-sidebar button wears it, so the
 * controls geovis draws over the map read as the workspace's own floating
 * controls. Copied, not imported: the workspace depends on geovis, never the
 * other way round.
 */
export const SURFACE = '#FAF9F7';
export const BORDER = '#E4DED3';
export const TEXT_STRONG = '#241F21';
export const TEXT_MUTED = '#524945';
export const ACCENT = '#337C59';
/** {@link ACCENT} as `r,g,b`, for the translucent tints built from it. */
export const ACCENT_RGB = '51,124,89';
export const ACCENT_TINT = `rgba(${ACCENT_RGB},0.07)`;
export const ACCENT_TINT_STRONG = `rgba(${ACCENT_RGB},0.14)`;
export const ACCENT_TINT_BORDER = `rgba(${ACCENT_RGB},0.2)`;
/** The neutral fill behind an unselected option, as in the mode thumbnails. */
export const NEUTRAL_FILL = '#f3f0ea';
/**
 * The reader's own location: the blue every map app marks "you are here" in,
 * so the dot reads as the reader at a glance.
 */
export const USER = '#2f6fe4';
/** {@link USER} as `r,g,b`, for its halo and the button's tint. */
export const USER_RGB = '47,111,228';
