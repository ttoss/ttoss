import { buildIcon, loadIcon } from '@ttoss/react-icons';
import type maplibregl from 'maplibre-gl';

import type { ImageSpec, PinImage, VisualizationSpec } from '../../spec/types';

/**
 * The pin's teardrop, in a 24 × 30 box: a circle of radius 10.5 around
 * (12, 12) narrowing to its tip at the bottom centre, which is the point a
 * `symbol` layer anchors with `iconAnchor: 'bottom'`.
 */
const PIN_PATH =
  'M12 29.25C12 29.25 1.5 19 1.5 12a10.5 10.5 0 1 1 21 0c0 7-10.5 17.25-10.5 17.25z';
const PIN_BOX = { width: 24, height: 30 };

/** Where the icon sits inside the pin's circle, in the same box. */
const ICON_BOX = { x: 5.5, y: 5.5, size: 13 };

const DEFAULT_SIZE = 28;
const DEFAULT_ICON_COLOR = '#ffffff';

/**
 * A white outline, so a pin reads against any basemap and a pin drawn over
 * another stays distinct from it.
 */
const OUTLINE = { color: '#ffffff', width: 1.5 };

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
 * Builds a pin's SVG: the teardrop in `pin.color`, outlined, with the icon
 * inside it in `pin.iconColor`.
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
 * // { svg: '<svg …>', width: 56, height: 70 }
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
  const size = pin.size ?? DEFAULT_SIZE;
  const width = Math.round(size * pixelRatio);
  const height = Math.round(
    ((size * PIN_BOX.height) / PIN_BOX.width) * pixelRatio
  );
  const iconColor = escapeAttribute(pin.iconColor ?? DEFAULT_ICON_COLOR);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${PIN_BOX.width} ${PIN_BOX.height}">`,
    `<path d="${PIN_PATH}" fill="${escapeAttribute(pin.color)}" stroke="${OUTLINE.color}" stroke-width="${OUTLINE.width}"/>`,
    // Iconify bodies paint with `currentColor`, which `color` sets here.
    `<svg x="${ICON_BOX.x}" y="${ICON_BOX.y}" width="${ICON_BOX.size}" height="${ICON_BOX.size}" viewBox="${escapeAttribute(icon.viewBox)}" color="${iconColor}" fill="${iconColor}">${icon.body}</svg>`,
    '</svg>',
  ].join('');

  return { svg, width, height };
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
