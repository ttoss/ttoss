/** The colour of a pin no one gave one: MapLibre's own marker blue. */
export const DEFAULT_PIN_COLOR = '#3FB1CE';

const DROP_KEYFRAMES_ID = 'geovis-pin-element-drop';

/**
 * The drop-in: the pin falls from above, overshoots and settles — the same
 * curve the proximity search's pins drop in with.
 */
const DROP_KEYFRAMES = `@keyframes ${DROP_KEYFRAMES_ID}{0%{transform:translateY(-22px) scale(.3);opacity:0}60%{transform:translateY(2px) scale(1.06);opacity:1}100%{transform:none;opacity:1}}`;

const ensureDropKeyframes = () => {
  if (document.getElementById(DROP_KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = DROP_KEYFRAMES_ID;
  style.textContent = DROP_KEYFRAMES;
  document.head.appendChild(style);
};

/**
 * A pin as a DOM element, for a `maplibregl.Marker` anchored at its
 * `'bottom'`: the same drop as the pins of `spec.images` — 24 px, turned 45°,
 * outlined in white over a soft shadow, inside a 30 × 36 box, with its shadow
 * on the ground under the tip — with a white dot where those carry their icon.
 *
 * @param params.color - The drop's colour.
 * @param params.animate - Drops in when added, as a pin marking a click does.
 * @returns The element to hand the marker.
 *
 * @example
 * new Marker({ element: createPinElement({ color: '#C0392B' }), anchor: 'bottom' });
 */
export const createPinElement = ({
  color = DEFAULT_PIN_COLOR,
  animate = false,
}: {
  color?: string;
  animate?: boolean;
} = {}): HTMLElement => {
  // No `position` of its own: MapLibre's marker class places it, absolutely,
  // which also makes it the box the ground shadow is laid out in.
  const element = document.createElement('div');
  element.style.cssText = 'width:30px;height:36px;pointer-events:none';

  // The marker positions `element` through its transform, so the drop-in
  // moves this inner box instead.
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;z-index:1;width:100%;height:100%';
  if (animate) {
    ensureDropKeyframes();
    box.style.transformOrigin = '50% 100%';
    box.style.animation = `${DROP_KEYFRAMES_ID} .5s cubic-bezier(.3,1.3,.5,1) both`;
  }

  const drop = document.createElement('span');
  drop.style.cssText = [
    'position:absolute',
    'left:3px',
    'top:0',
    'width:24px',
    'height:24px',
    'box-sizing:border-box',
    'border-radius:50% 50% 50% 0',
    'transform:rotate(-45deg)',
    'border:2px solid #ffffff',
    'box-shadow:0 3px 8px rgba(0,0,0,0.25)',
  ].join(';');
  drop.style.background = color;

  const dot = document.createElement('span');
  dot.style.cssText =
    'position:absolute;left:11px;top:8px;width:8px;height:8px;border-radius:50%;background:#ffffff';

  box.append(drop, dot);

  // On the ground, outside the box that drops in: the shadow stays put while
  // the pin falls onto it.
  const ground = document.createElement('span');
  ground.style.cssText =
    'position:absolute;left:9px;bottom:0;width:12px;height:4px;border-radius:50%;background:rgba(0,0,0,0.22)';

  element.append(box, ground);
  return element;
};
