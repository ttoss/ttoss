import * as React from 'react';

import { renderPinSvg } from '../adapters/maplibre/pinImages';
import type { PinImage } from '../spec/types';
import { UNCATEGORISED } from './GeoVisProximitySearch.hitPin';
import { AT_ORIGIN, KEYFRAMES } from './GeoVisProximitySearch.styles';

/** A pin's image as a data URL, and its size in CSS pixels. */
type PinPicture = { src: string; width: number; height: number };

/**
 * Draws a pin of `spec.images` as the map draws it, once its icon loads;
 * `null` until then, or for a pin the spec declares no image for.
 */
const usePinPicture = (pin: PinImage | undefined): PinPicture | null => {
  const [picture, setPicture] = React.useState<PinPicture | null>(null);
  // Keyed by what the pin looks like, so a spec rebuilt with an equal pin
  // does not redraw it.
  const key = pin ? JSON.stringify(pin) : '';
  React.useEffect(() => {
    if (!key) return;
    let cancelled = false;
    renderPinSvg(JSON.parse(key) as PinImage)
      .then(({ svg, width, height }) => {
        if (cancelled) return;
        setPicture({
          src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          width,
          height,
        });
      })
      .catch(() => {
        // An icon Iconify cannot find: the plain drop below stands in.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return key ? picture : null;
};

/**
 * The pin the search started from, drawn here — above the circle — while the
 * map hides its own copy of it: the same picture, standing on the point, a
 * little larger than its layer's other pins. A pin drawn from a sprite, or
 * whose icon will not load, is shown as a plain drop. Clicking it clears the
 * search, as clicking the map's pin would.
 *
 * @param params.pin - The pin's image in `spec.images`, if it has one.
 * @param params.iconSize - The layer's `paint.iconSize`.
 */
export const FocusPin = ({
  pin,
  iconSize,
  label,
  onClick,
}: {
  pin: PinImage | undefined;
  iconSize: number;
  label: string;
  onClick: () => void;
}) => {
  const picture = usePinPicture(pin);
  const width = (picture?.width ?? 30) * iconSize;
  const height = (picture?.height ?? 36) * iconSize;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      style={{
        ...AT_ORIGIN,
        zIndex: 2,
        width,
        height,
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        // Stands on the point, as the map's pins do with `iconAnchor: 'bottom'`.
        transform: 'translate(-50%,-100%)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 100%',
          animation: `${KEYFRAMES.focus} .2s ease-out both`,
        }}
      >
        {picture ? (
          <img
            src={picture.src}
            alt=""
            draggable={false}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        ) : (
          <span
            style={{
              position: 'absolute',
              left: 3 * iconSize,
              top: 0,
              width: 24 * iconSize,
              height: 24 * iconSize,
              boxSizing: 'border-box',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: pin?.color ?? UNCATEGORISED,
              border: '2px solid #ffffff',
              boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
            }}
          />
        )}
      </span>
    </button>
  );
};
