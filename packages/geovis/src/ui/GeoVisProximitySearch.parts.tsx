import * as React from 'react';

import {
  accent,
  AT_ORIGIN,
  circle,
  EASE_OUT,
  KEYFRAMES,
  MONO,
} from './GeoVisProximitySearch.styles';
import { ACCENT, USER, USER_RGB } from './palette';

/** A distance tag over the circle, as the radius line carries it. */
const RadiusTag = ({ text, left }: { text: string; left: number }) => {
  return (
    <span
      style={{
        position: 'absolute',
        left,
        top: -20,
        transform: 'translateX(-50%)',
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        color: ACCENT,
        background: 'rgba(255,255,255,0.88)',
        padding: '1px 5px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
};

/**
 * The searched area: the circle of the radius, a dashed ring at each smaller
 * radius on offer with its distance, the radius line with its own, and — while
 * the answer is awaited — the sweep and the pulses.
 *
 * @param params.pixelsPerMetre - The current scale, which sizes every ring.
 */
export const RadiusArea = ({
  request,
  radius,
  radii,
  pixelsPerMetre,
  loading,
  formatRadius,
}: {
  request: number;
  radius: number;
  radii: number[];
  pixelsPerMetre: number;
  loading: boolean;
  formatRadius: (metres: number) => string;
}) => {
  const R = radius * pixelsPerMetre;
  const wide = radius > radii[0];
  const inner = radii.filter((ring) => {
    return ring < radius;
  });
  return (
    <>
      <div
        key={`area${request}`}
        style={circle(R, {
          background: accent(0.1),
          border: `2px solid ${accent(0.6)}`,
          animation: `${KEYFRAMES.grow} .45s ${EASE_OUT} both`,
        })}
      />
      {inner.map((ring) => {
        const r = ring * pixelsPerMetre;
        return (
          <React.Fragment key={`ring${ring}`}>
            <div
              style={circle(r, {
                background: accent(0.07),
                border: `1.5px dashed ${accent(0.7)}`,
                transform: 'translate(-50%,-50%)',
                animation: `${KEYFRAMES.fadeIn} .35s both`,
              })}
            />
            <div
              style={{
                ...AT_ORIGIN,
                pointerEvents: 'none',
                animation: `${KEYFRAMES.fadeIn} .3s .4s both`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: -r,
                  top: 0,
                  transform: 'translate(-50%,-50%)',
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  color: ACCENT,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '0 4px',
                  borderRadius: 3,
                }}
              >
                {formatRadius(ring)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      <div
        key={`rad${request}-${radius}`}
        style={{
          ...AT_ORIGIN,
          width: R,
          borderTop: `1.5px dashed ${accent(0.75)}`,
          pointerEvents: 'none',
          animation: `${KEYFRAMES.fadeIn} .3s .3s both`,
        }}
      >
        <RadiusTag
          text={formatRadius(radius)}
          left={R / 2 + (wide ? ((radii[0] / radius) * R) / 2 : 0)}
        />
      </div>
      {loading && (
        <>
          <div
            key={`sweep${request}-${radius}`}
            style={circle(R, {
              background: `conic-gradient(from 0deg, ${accent(0)} 0deg, ${accent(0)} 270deg, ${accent(0.38)} 360deg)`,
              animation: `${KEYFRAMES.spin} 1.3s linear infinite`,
            })}
          />
          {[0, 0.8].map((delay) => {
            return (
              <div
                key={`pulse${delay}${request}-${radius}`}
                style={circle(R, {
                  border: `2px solid ${accent(0.55)}`,
                  animation: `${KEYFRAMES.pulse} 1.6s ${delay}s ease-out infinite`,
                  opacity: 0,
                })}
              />
            );
          })}
        </>
      )}
    </>
  );
};
/** The small spinner the bar shows while an answer is awaited. */
export const Spinner = () => {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        flexShrink: 0,
        borderRadius: '50%',
        border: `2px solid ${accent(0.25)}`,
        borderTopColor: ACCENT,
        animation: `${KEYFRAMES.rotate} .7s linear infinite`,
      }}
    />
  );
};

/**
 * The reader, when the search runs from their location: a blue dot with a
 * pulsing halo and a "You" tag. Clicking it clears the search, as the clicked
 * pin does for a search from a pin.
 */
export const YouMarker = ({
  tag,
  title,
  label,
  onClick,
}: {
  tag: string;
  title: string;
  label: string;
  onClick: () => void;
}) => {
  return (
    <>
      <div
        style={{
          ...AT_ORIGIN,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: `rgba(${USER_RGB},0.25)`,
          animation: `${KEYFRAMES.pulse} 2s ease-out infinite`,
          pointerEvents: 'none',
        }}
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        aria-label={label}
        title={title}
        style={{
          ...AT_ORIGIN,
          zIndex: 2,
          width: 22,
          height: 22,
          padding: 0,
          boxSizing: 'border-box',
          borderRadius: '50%',
          background: USER,
          border: '3px solid #ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transform: 'translate(-50%,-50%)',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          ...AT_ORIGIN,
          top: -22,
          zIndex: 2,
          transform: 'translate(-50%,-100%)',
          padding: '2px 6px',
          borderRadius: 5,
          background: USER,
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: `${KEYFRAMES.fadeIn} .3s both`,
        }}
      >
        {tag}
      </span>
    </>
  );
};
