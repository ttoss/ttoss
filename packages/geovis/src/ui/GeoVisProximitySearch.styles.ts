import type * as React from 'react';

import { ACCENT_RGB } from './palette';

/** Prefix of this control's keyframes, so they never clash with the app's. */
const K = 'geovis-proximity';

/** The keyframes' names, as the styles below use them. */
export const KEYFRAMES = {
  grow: `${K}-grow`,
  spin: `${K}-spin`,
  pulse: `${K}-pulse`,
  drop: `${K}-drop`,
  fadeIn: `${K}-op`,
  rotate: `${K}-rot`,
  cardIn: `${K}-fade`,
  focus: `${K}-focus`,
};

/** How much larger the clicked pin stands while its search is shown. */
export const FOCUS_SCALE = 1.25;

/**
 * The animations the search draws with: the circle growing in, the sweep and
 * the pulses while it searches, the answers dropping in, the spinners, the
 * card fading in and the clicked pin growing. Mounted once, beside the control.
 */
export const KEYFRAMES_CSS = `
@keyframes ${KEYFRAMES.grow} { from { transform: translate(-50%,-50%) scale(0); opacity: 0 } to { transform: translate(-50%,-50%) scale(1); opacity: 1 } }
@keyframes ${KEYFRAMES.spin} { from { transform: translate(-50%,-50%) rotate(0deg) } to { transform: translate(-50%,-50%) rotate(360deg) } }
@keyframes ${KEYFRAMES.pulse} { 0% { transform: translate(-50%,-50%) scale(0.08); opacity: 0.7 } 100% { transform: translate(-50%,-50%) scale(1); opacity: 0 } }
@keyframes ${KEYFRAMES.drop} { 0% { transform: translate(-50%,-100%) translateY(-22px) scale(0.3); opacity: 0 } 60% { transform: translate(-50%,-100%) translateY(2px) scale(1.06); opacity: 1 } 100% { transform: translate(-50%,-100%) scale(1); opacity: 1 } }
@keyframes ${KEYFRAMES.fadeIn} { from { opacity: 0 } to { opacity: 1 } }
@keyframes ${KEYFRAMES.rotate} { to { transform: rotate(360deg) } }
@keyframes ${KEYFRAMES.cardIn} { from { opacity: 0; transform: translate(-50%, 4px) } to { opacity: 1; transform: translate(-50%, 0) } }
@keyframes ${KEYFRAMES.focus} { from { transform: scale(1) } to { transform: scale(${FOCUS_SCALE}) } }
`;

/** The accent at an opacity, for the circle's fills and strokes. */
export const accent = (opacity: number) => {
  return `rgba(${ACCENT_RGB},${opacity})`;
};

/** Numbers — radii, distances, counts — in a monospace face. */
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** The easing the circle and its rings move with. */
export const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';

/** Anchored at the layer's origin: the searched point. */
export const AT_ORIGIN: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
};

/** A circle of radius `radius` px, centred on the searched point. */
export const circle = (
  radius: number,
  extra: React.CSSProperties
): React.CSSProperties => {
  return {
    ...AT_ORIGIN,
    width: 2 * radius,
    height: 2 * radius,
    borderRadius: '50%',
    pointerEvents: 'none',
    ...extra,
  };
};
