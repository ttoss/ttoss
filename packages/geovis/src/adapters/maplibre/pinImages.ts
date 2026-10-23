import { buildIcon, loadIcon } from '@ttoss/react-icons';
import type * as maplibregl from 'maplibre-gl';

import type { ImageSpec, PinImage, VisualizationSpec } from '../../spec/types';

/*
 * The pin's drop: a square with three corners fully rounded and the fourth
 * sharp, turned 45° so the sharp corner points down — a 24 px drop with a 2 px
 * white outline and a soft shadow under it, the icon centred in its round part.
 *
 * Laid out in CSS pixels, at the default size, inside the 30 × 36 box a pin
 * stands in: the box's bottom centre is the point a `symbol` layer anchors
 * with `iconAnchor: 'bottom'`, a few pixels under the tip so the shadow has
 * room. The image pads the box on the sides and the top, where the shadow
 * spreads too, and not at the bottom, which would lift the pin off its point.
 */
const PIN_BOX = { width: 30, height: 36 };
const SHADOW_PAD = { x: 8, top: 4 };
const VIEW = {
  width: PIN_BOX.width + 2 * SHADOW_PAD.x,
  height: PIN_BOX.height + SHADOW_PAD.top,
};

/** Centre of the drop's round part: 3 px in from the box's left, 12 down. */
const DROP_CENTER = { x: SHADOW_PAD.x + 3 + 12, y: SHADOW_PAD.top + 12 };

/**
 * The drop's outline, centred on the origin before it is turned: three
 * quarter circles and the square corner, traced along the middle of the 2 px
 * outline so its outer edge spans the full 24 px.
 */
const DROP_PATH =
  'M-11 0A11 11 0 0 1 0-11A11 11 0 0 1 11 0A11 11 0 0 1 0 11L-11 11Z';

/** The icon: 12 px, centred on the drop's round part. */
const ICON_SIZE = 12;

/**
 * A layer's pins stand a little taller than the 30 px pins a proximity search
 * drops in, so the places a search starts from read as the larger marks.
 */
const DEFAULT_SIZE = 34;
const DEFAULT_ICON_COLOR = '#ffffff';

/**
 * A white outline, so a pin reads against any basemap and a pin drawn over
 * another stays distinct from it.
 */
const OUTLINE = { color: '#ffffff', width: 2 };

/** The shadow under the drop: CSS `0 3px 8px rgba(0,0,0,0.25)`. */
const SHADOW = { dy: 3, deviation: 4, opacity: 0.25 };

/**
 * The shadow the pin casts on the ground: a 12 × 4 ellipse under the tip,
 * resting on the box's bottom edge so it never lifts the pin off its point.
 */
const GROUND_SHADOW = {
  cx: SHADOW_PAD.x + PIN_BOX.width / 2,
  cy: VIEW.height - 2,
  rx: 6,
  ry: 2,
  fill: 'rgba(0,0,0,0.22)',
};

/**
 * A 1 × 1 transparent image registered under a pin's id while the pin loads.
 * Without it, a layer drawn before the pin is ready makes MapLibre warn that
 * the image is missing, once per tile.
 */
const PLACEHOLDER = { width: 1, height: 1, data: new Uint8Array(4) };

/** Escapes a value for a double-quoted SVG attribute. */
const escapeAttribute = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
};

/**
 * Builds a pin's SVG: the drop in `pin.color`, outlined in white over a soft
 * shadow, with the icon inside it in `pin.iconColor` and its shadow on the
 * ground under the tip.
 *
 * Pure, so the pin's look is testable without a browser; turning it into
 * pixels is {@link rasterizeSvg}'s job.
 *
 * @param params.pin - The pin to draw.
 * @param params.icon - The icon's SVG `viewBox` and body, as Iconify's
 * `buildIcon` returns them.
 * @param params.pixelRatio - Device pixels per CSS pixel the image is drawn
 * at, so it stays sharp on high-density screens.
 * @returns The SVG markup and its size in device pixels.
 *
 * @example
 * buildPinSvg({ pin, icon: { viewBox: '0 0 15 15', body: '<path d="…"/>' }, pixelRatio: 2 });
 * // { svg: '<svg …>', width: 104, height: 91 }
 */
export const buildPinSvg = ({
  pin,
  icon,
  pixelRatio,
}: {
  pin: PinImage;
  icon: { viewBox: string; body: string };
  pixelRatio: number;
}): { svg: string; width: number; height: number } => {
  const scale = (pin.size ?? DEFAULT_SIZE) / PIN_BOX.width;
  const width = Math.round(VIEW.width * scale * pixelRatio);
  const height = Math.round(VIEW.height * scale * pixelRatio);
  const iconColor = escapeAttribute(pin.iconColor ?? DEFAULT_ICON_COLOR);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${VIEW.width} ${VIEW.height}">`,
    `<defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="${SHADOW.dy}" stdDeviation="${SHADOW.deviation}" flood-color="#000000" flood-opacity="${SHADOW.opacity}"/></filter></defs>`,
    `<ellipse cx="${GROUND_SHADOW.cx}" cy="${GROUND_SHADOW.cy}" rx="${GROUND_SHADOW.rx}" ry="${GROUND_SHADOW.ry}" fill="${GROUND_SHADOW.fill}"/>`,
    `<path d="${DROP_PATH}" transform="translate(${DROP_CENTER.x} ${DROP_CENTER.y}) rotate(-45)" fill="${escapeAttribute(pin.color)}" stroke="${OUTLINE.color}" stroke-width="${OUTLINE.width}" filter="url(#shadow)"/>`,
    // Iconify bodies paint with `currentColor`, which `color` sets here.
    `<svg x="${DROP_CENTER.x - ICON_SIZE / 2}" y="${DROP_CENTER.y - ICON_SIZE / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="${escapeAttribute(icon.viewBox)}" color="${iconColor}" fill="${iconColor}">${icon.body}</svg>`,
    '</svg>',
  ].join('');

  return { svg, width, height };
};

/**
 * A pin's SVG, its icon loaded, at one device pixel per CSS pixel — to draw
 * the pin outside the map exactly as the map draws it.
 *
 * @param pin - The pin to draw.
 * @returns The SVG markup and its size in CSS pixels.
 * @throws If the icon cannot be loaded.
 *
 * @example
 * const { svg, width, height } = await renderPinSvg(pin);
 */
export const renderPinSvg = async (
  pin: PinImage
): Promise<{ svg: string; width: number; height: number }> => {
  const { attributes, body } = buildIcon(await loadIcon(pin.icon));
  return buildPinSvg({
    pin,
    icon: { viewBox: attributes.viewBox, body },
    pixelRatio: 1,
  });
};

/**
 * Decodes SVG markup into an image MapLibre can register.
 *
 * @param params.svg - The markup.
 * @param params.width - Its width in device pixels.
 * @param params.height - Its height in device pixels.
 * @returns The loaded image element.
 * @throws If the browser cannot decode the SVG.
 */
const rasterizeSvg = ({
  svg,
  width,
  height,
}: {
  svg: string;
  width: number;
  height: number;
}): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image(width, height);
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('the pin SVG could not be decoded'));
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};

/**
 * Device pixels per CSS pixel to draw pins at: the screen's, rounded up so a
 * 1.5× display draws at 2×, and capped at 3× where more detail is invisible.
 */
const pinPixelRatio = (): number => {
  const ratio =
    typeof window === 'undefined' ? 1 : (window.devicePixelRatio ?? 1);
  return Math.min(3, Math.max(1, Math.ceil(ratio)));
};

/**
 * What each map has registered, or is loading, under each image id: the
 * serialized descriptor. A pin is rebuilt only when its descriptor changes, not
 * on every spec update — a timeline ticking through years re-syncs the spec
 * many times a second, and each rebuild is an icon lookup plus an SVG decode.
 */
const registeredImages = new WeakMap<maplibregl.Map, Map<string, string>>();

/** A descriptor's identity: two equal ones draw the same pin. */
const imageKey = (image: ImageSpec): string => {
  return JSON.stringify([
    image.kind,
    image.icon,
    image.color,
    image.iconColor ?? null,
    image.size ?? null,
  ]);
};

/**
 * Builds a pin and swaps it in for its placeholder — unless a later sync has
 * since replaced or removed the descriptor, in which case the result is
 * dropped rather than overwriting the newer pin.
 *
 * A failure (an icon name Iconify does not know, an SVG the browser cannot
 * decode) is logged and leaves the transparent placeholder in place: the
 * layer draws nothing for that pin rather than breaking the map.
 */
const loadPin = async ({
  map,
  image,
  key,
  registered,
}: {
  map: maplibregl.Map;
  image: PinImage;
  key: string;
  registered: Map<string, string>;
}): Promise<void> => {
  try {
    const { attributes, body } = buildIcon(await loadIcon(image.icon));
    const pixelRatio = pinPixelRatio();
    const pinSvg = buildPinSvg({
      pin: image,
      icon: { viewBox: attributes.viewBox, body },
      pixelRatio,
    });
    const element = await rasterizeSvg(pinSvg);

    if (registered.get(image.id) !== key) return;
    if (map.hasImage(image.id)) map.removeImage(image.id);
    map.addImage(image.id, element, { pixelRatio });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[geovis] pin "${image.id}" (${image.icon}) could not be built; its layer draws nothing for it`,
      error
    );
  }
};

/**
 * Unregisters and removes from the map every image `previousSpec` declared
 * that `images` no longer does.
 */
const removeUndeclaredImages = ({
  map,
  images,
  previousSpec,
  registered,
}: {
  map: maplibregl.Map;
  images: NonNullable<VisualizationSpec['images']>;
  previousSpec: VisualizationSpec | null;
  registered: Map<string, string>;
}): void => {
  for (const previous of previousSpec?.images ?? []) {
    const stillDeclared = images.some((image) => {
      return image.id === previous.id;
    });
    if (!stillDeclared) {
      registered.delete(previous.id);
      if (map.hasImage(previous.id)) map.removeImage(previous.id);
    }
  }
};

/**
 * Reconciles the images registered on the map with `spec.images`: removes the
 * ones the spec no longer declares, and (re)builds the ones that are new,
 * changed, or missing from the map — as after a basemap change, since
 * `setStyle` discards every registered image.
 *
 * Runs before the layers are upserted, so a layer referencing a pin finds at
 * least its placeholder. The pin itself arrives asynchronously, and MapLibre
 * redraws the tiles that use it when it does.
 *
 * @param map - The live map.
 * @param spec - The spec being applied.
 * @param previousSpec - The spec applied before, or `null` on mount and after
 * a style reset, when there is nothing on the map to remove.
 */
export const syncImages = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec | null
): void => {
  const registered = registeredImages.get(map) ?? new Map<string, string>();
  registeredImages.set(map, registered);
  const images = spec.images ?? [];

  removeUndeclaredImages({ map, images, previousSpec, registered });

  for (const image of images) {
    const key = imageKey(image);
    if (registered.get(image.id) === key && map.hasImage(image.id)) continue;

    registered.set(image.id, key);
    if (!map.hasImage(image.id)) map.addImage(image.id, PLACEHOLDER);
    void loadPin({ map, image, key, registered });
  }
};
