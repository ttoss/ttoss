import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import { OVERLAY_Z_INDEX } from './GeoVisLayerControl.styles';
import { RIGHT, SIZE, TOP } from './GeoVisMapModeControl';
import { messages } from './GeoVisProximitySearch.messages';
import { KEYFRAMES } from './GeoVisProximitySearch.styles';
import {
  BORDER,
  SURFACE,
  TEXT_MUTED,
  TEXT_STRONG,
  USER,
  USER_RGB,
} from './palette';

/** How long the browser may take to find the reader, in milliseconds. */
const LOCATE_TIMEOUT_MS = 10_000;

/** The gap between the map mode button and this one, stacked under it. */
const STACK_GAP = 10;

/**
 * Where the location flow stands: `idle`, `ask` while the dialog explains why
 * the location is needed, `locating` while the browser looks it up, `denied`
 * once it could not be had.
 */
export type LocatePhase = 'idle' | 'ask' | 'locating' | 'denied';

/**
 * Whether the browser can tell the reader's location: it offers geolocation
 * and the page is a secure context — over plain HTTP the request always fails,
 * so the button is not offered at all.
 */
export const canLocate = () => {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext !== false &&
    typeof navigator !== 'undefined' &&
    navigator.geolocation != null
  );
};

/**
 * What the browser already decided about the location: `granted`, `denied`,
 * or `prompt` — also when it cannot say, as without the Permissions API.
 */
const queryPermission = async (): Promise<PermissionState> => {
  try {
    const status = await navigator.permissions?.query({
      name: 'geolocation',
    });
    return status?.state ?? 'prompt';
  } catch {
    return 'prompt';
  }
};

/**
 * The flow from the button to the reader's location: the explanation first,
 * unless the browser already granted it; the lookup; the error dialog when it
 * fails. `onLocated` receives the location, `[lng, lat]`.
 *
 * A lookup that ends after the flow moved on — the dialog closed, the control
 * unmounted — is dropped.
 */
export const useUserLocation = (
  onLocated: (origin: [number, number]) => void
) => {
  const [phase, setPhase] = React.useState<LocatePhase>('idle');
  const onLocatedRef = React.useRef(onLocated);
  React.useEffect(() => {
    onLocatedRef.current = onLocated;
  });
  // Counts the lookups, so only the latest one's answer is used.
  const lookupRef = React.useRef(0);
  React.useEffect(() => {
    return () => {
      lookupRef.current += 1;
    };
  }, []);

  const locate = React.useCallback(() => {
    lookupRef.current += 1;
    const lookup = lookupRef.current;
    setPhase('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (lookupRef.current !== lookup) return;
        setPhase('idle');
        onLocatedRef.current([coords.longitude, coords.latitude]);
      },
      () => {
        if (lookupRef.current !== lookup) return;
        setPhase('denied');
      },
      { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT_MS }
    );
  }, []);

  const start = React.useCallback(async () => {
    const permission = await queryPermission();
    if (permission === 'granted') locate();
    else setPhase(permission === 'denied' ? 'denied' : 'ask');
  }, [locate]);

  const dismiss = React.useCallback(() => {
    lookupRef.current += 1;
    setPhase('idle');
  }, []);

  return { phase, start, locate, dismiss };
};

/** `locate-fixed`: a crosshair around a dot. */
const LocateIcon = () => {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block' }}
    >
      <line x1="2" x2="5" y1="12" y2="12" />
      <line x1="19" x2="22" y1="12" y2="12" />
      <line x1="12" x2="12" y1="2" y2="5" />
      <line x1="12" x2="12" y1="19" y2="22" />
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};

/** A spinner in the given colour, ring and head. */
const RingSpinner = ({
  size,
  ring,
  head,
}: {
  size: number;
  ring: string;
  head: string;
}) => {
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: `2px solid ${ring}`,
        borderTopColor: head,
        animation: `${KEYFRAMES.rotate} .7s linear infinite`,
      }}
    />
  );
};

/**
 * The button that searches from the reader's location, in the map's control
 * column — under the map mode button when there is one. Blue while a search
 * from the reader is shown; a spinner while the browser looks the reader up.
 */
export const LocateButton = ({
  belowMapMode,
  active,
  locating,
  title,
  label,
  onClick,
}: {
  belowMapMode: boolean;
  active: boolean;
  locating: boolean;
  title: string;
  label: string;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: OVERLAY_Z_INDEX,
        top: belowMapMode ? TOP + SIZE + STACK_GAP : TOP,
        right: RIGHT,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={label}
        aria-pressed={active}
        aria-busy={locating}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        style={{
          width: SIZE,
          height: SIZE,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: `1px solid ${active ? `rgba(${USER_RGB},0.3)` : BORDER}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          cursor: locating ? 'progress' : 'pointer',
          background: active ? `rgba(${USER_RGB},0.1)` : SURFACE,
          color: active ? USER : hovered ? TEXT_STRONG : TEXT_MUTED,
          transition: 'color 0.15s ease',
        }}
      >
        {locating ? (
          <RingSpinner size={16} ring={`rgba(${USER_RGB},0.25)`} head={USER} />
        ) : (
          <LocateIcon />
        )}
      </button>
    </div>
  );
};

/** The note shown while the browser looks the reader up, atop the map. */
export const LocatingToast = () => {
  const { intl } = useI18n();
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 30,
        top: 10,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 14px',
          borderRadius: 10,
          background: TEXT_STRONG,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          animation: `${KEYFRAMES.fadeIn} .2s both`,
        }}
      >
        <RingSpinner size={12} ring="rgba(255,255,255,0.3)" head="#ffffff" />
        {intl.formatMessage(messages.locating)}
      </div>
    </div>
  );
};
