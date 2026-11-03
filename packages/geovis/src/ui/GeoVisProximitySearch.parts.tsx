import { destinationPoint } from '../react/proximity.geo';
import {
  accent,
  AT_ORIGIN,
  KEYFRAMES,
  MONO,
} from './GeoVisProximitySearch.styles';
import { ACCENT, TEXT_STRONG, USER, USER_RGB } from './palette';

/** A distance tag over the circle, standing on the radius line at `x`, `y`. */
const RadiusTag = ({ text, x, y }: { text: string; x: number; y: number }) => {
  return (
    <span
      style={{
        position: 'absolute',
        left: x,
        top: y - 20,
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

/** A point on screen, in pixels from the map's top left. */
type ScreenPoint = { x: number; y: number };

/**
 * The searched area's distances, over the circle the map draws (see
 * `useRadiusArea`): each smaller radius on offer at its ring's west end, and
 * the radius on its line. Placed at the points they label as the map projects
 * them, so they follow the circle as the map tilts and turns, while staying
 * upright to be read.
 *
 * @param params.origin - The searched point, `[lng, lat]`.
 * @param params.originPx - Where `origin` is on screen: the labels are placed
 * from it.
 * @param params.project - The map's `[lng, lat]` → screen projection.
 */
export const RadiusLabels = ({
  request,
  origin,
  radius,
  radii,
  originPx,
  project,
  formatRadius,
}: {
  request: number;
  origin: [number, number];
  radius: number;
  radii: number[];
  originPx: ScreenPoint;
  project: (lngLat: [number, number]) => ScreenPoint;
  formatRadius: (metres: number) => string;
}) => {
  const at = (metres: number, bearing: number) => {
    const point = project(destinationPoint({ origin, metres, bearing }));
    return { x: point.x - originPx.x, y: point.y - originPx.y };
  };
  const wide = radius > radii[0];
  // Halfway along the line, or along the part of it past the first ring.
  const tag = at(radius / 2 + (wide ? radii[0] / 2 : 0), 90);
  const inner = radii.filter((ring) => {
    return ring < radius;
  });
  return (
    <>
      {inner.map((ring) => {
        const point = at(ring, 270);
        return (
          <div
            key={`ring${ring}`}
            style={{
              ...AT_ORIGIN,
              pointerEvents: 'none',
              animation: `${KEYFRAMES.fadeIn} .3s .4s both`,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: point.x,
                top: point.y,
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
        );
      })}
      <div
        key={`rad${request}-${radius}`}
        style={{
          ...AT_ORIGIN,
          pointerEvents: 'none',
          animation: `${KEYFRAMES.fadeIn} .3s .3s both`,
        }}
      >
        <RadiusTag text={formatRadius(radius)} x={tag.x} y={tag.y} />
      </div>
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

/**
 * The point of the map the search runs from, with `fromAnyPoint`: a dark dot
 * in a white ring, set apart from the reader's blue one and from the answers'
 * pins. Clicking it clears the search, as the clicked pin does.
 */
export const PointMarker = ({
  title,
  label,
  onClick,
}: {
  title: string;
  label: string;
  onClick: () => void;
}) => {
  return (
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
        width: 18,
        height: 18,
        padding: 0,
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: TEXT_STRONG,
        border: '4px solid #ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transform: 'translate(-50%,-50%)',
        cursor: 'pointer',
        animation: `${KEYFRAMES.fadeIn} .2s both`,
      }}
    />
  );
};
