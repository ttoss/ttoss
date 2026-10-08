import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import * as React from 'react';

import type { GeovisWorkspaceSidebarBearingSetting } from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { COLOR, FONT_MONO } from './theme';
import { useSettingValue } from './useSettingValue';

/** Side of the dial, in pixels; the SVGs share it as their viewBox. */
const DIAL = 68;
const CENTER = DIAL / 2;

/** The coarse step: the rotate buttons and Shift + an arrow key. */
const QUICK_STEP = 45;

/** The `select` keys of `bearingReadout`, clockwise from north. */
const POINTS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;

/** Wraps any whole number of degrees into `0`–`359`. */
export const normalizeBearing = (degrees: number): number => {
  return ((Math.round(degrees) % 360) + 360) % 360;
};

/** The cardinal point nearest a bearing, as a `bearingReadout` select key. */
const nearestPoint = (bearing: number): (typeof POINTS)[number] => {
  return POINTS[Math.round(bearing / QUICK_STEP) % POINTS.length];
};

/**
 * The bearing a setting holds: its serialized value, or its default before it
 * has published one, wrapped onto the circle. A stale or hand-written value
 * that is not a number reads as north.
 */
export const resolveBearing = ({
  control,
  raw,
}: {
  control: GeovisWorkspaceSidebarBearingSetting;
  raw: string | undefined;
}): number => {
  return normalizeBearing(Number(raw ?? control.defaultValue ?? 0) || 0);
};

/**
 * Formats a bearing as its readout — the nearest cardinal point and the
 * degrees, `NE · 45°` — for the dial's own label and for a sub-block heading
 * that shows it in the control's place.
 *
 * @returns The formatter.
 *
 * @example
 * const formatBearing = useFormatBearing();
 * formatBearing(45); // 'NE · 45°'
 */
export const useFormatBearing = (): ((bearing: number) => string) => {
  const {
    intl: { formatMessage },
  } = useI18n();
  return (bearing) => {
    return formatMessage(messages.bearingReadout, {
      point: nearestPoint(bearing),
      degrees: bearing,
    });
  };
};

/**
 * The bearing a pointer stands for: its angle around the dial's centre,
 * clockwise from straight up, snapped to `step`.
 */
const bearingAtPointer = ({
  event,
  step,
}: {
  event: React.PointerEvent<HTMLElement>;
  step: number;
}): number => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const degrees = (Math.atan2(x, -y) * 180) / Math.PI;
  return normalizeBearing(Math.round(degrees / step) * step);
};

/**
 * The bearing one quick step away: snapped to the nearest multiple of 45°
 * first, so the buttons always land on a cardinal point — from `37°`, right
 * goes to `90°`, not `82°`.
 */
const quickStepFrom = ({
  bearing,
  direction,
}: {
  bearing: number;
  direction: 1 | -1;
}): number => {
  const snapped = Math.round(bearing / QUICK_STEP) * QUICK_STEP;
  return normalizeBearing(snapped + direction * QUICK_STEP);
};

/** The 24 ticks around the rim, one every 15°, longer at the four points. */
const TICKS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * 15 * Math.PI) / 180;
  const major = index % 6 === 0;
  const inner = major ? 26 : 29;
  const outer = 32;
  return {
    index,
    x1: CENTER + inner * Math.sin(angle),
    y1: CENTER - inner * Math.cos(angle),
    x2: CENTER + outer * Math.sin(angle),
    y2: CENTER - outer * Math.cos(angle),
    stroke:
      index === 0
        ? COLOR.primary
        : major
          ? COLOR.textFaint
          : COLOR.textDisabled,
    width: major ? 1.6 : 1,
  };
});

/**
 * The dial: a fixed rim of ticks, north marked, and a needle turned to the
 * bearing. The needle eases to a value set by a key or a button, and follows
 * the pointer unanimated while dragged.
 */
const Dial = ({
  bearing,
  step,
  label,
  valueText,
  onChange,
}: {
  bearing: number;
  step: number;
  label: string;
  valueText: string;
  onChange: (next: number) => void;
}) => {
  const [dragging, setDragging] = React.useState(false);

  return (
    <Box
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={bearing}
      aria-valuetext={valueText}
      onPointerDown={(event) => {
        // Captured, so the drag keeps turning the dial once the pointer
        // leaves its 68px.
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
        onChange(bearingAtPointer({ event, step }));
      }}
      onPointerMove={(event) => {
        if (dragging) onChange(bearingAtPointer({ event, step }));
      }}
      onPointerUp={() => {
        setDragging(false);
      }}
      onPointerCancel={() => {
        setDragging(false);
      }}
      onKeyDown={(event) => {
        const amount = event.shiftKey ? QUICK_STEP : step;
        const direction =
          event.key === 'ArrowRight' || event.key === 'ArrowUp'
            ? 1
            : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
              ? -1
              : 0;
        if (direction === 0) return;
        event.preventDefault();
        onChange(normalizeBearing(bearing + direction * amount));
      }}
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: `${DIAL}px`,
        height: `${DIAL}px`,
        borderRadius: '999px',
        cursor: dragging ? 'grabbing' : 'grab',
        // The drag is the dial's own gesture: without this a touch scrolls
        // the sidebar instead.
        touchAction: 'none',
        backgroundColor: COLOR.fillAlt,
        border: `1px solid ${COLOR.border}`,
        '&:focus-visible': {
          outline: `2px solid ${COLOR.primarySoft}`,
          outlineOffset: '2px',
        },
      }}
    >
      <svg
        viewBox={`0 0 ${DIAL} ${DIAL}`}
        width={DIAL}
        height={DIAL}
        aria-hidden="true"
        style={{ position: 'absolute', inset: '-1px', pointerEvents: 'none' }}
      >
        {TICKS.map((tick) => {
          return (
            <line
              key={tick.index}
              x1={tick.x1.toFixed(1)}
              y1={tick.y1.toFixed(1)}
              x2={tick.x2.toFixed(1)}
              y2={tick.y2.toFixed(1)}
              stroke={tick.stroke}
              strokeWidth={tick.width}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <svg
        viewBox={`0 0 ${DIAL} ${DIAL}`}
        width={DIAL}
        height={DIAL}
        aria-hidden="true"
        data-testid="bearing-needle"
        style={{
          position: 'absolute',
          inset: '-1px',
          pointerEvents: 'none',
          transform: `rotate(${bearing}deg)`,
          transition: dragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.3, 0.7, 0.2, 1)',
        }}
      >
        <polygon points="34,12 39,34 29,34" fill={COLOR.primary} />
        <polygon points="34,56 39,34 29,34" fill={COLOR.textDisabled} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={3}
          fill={COLOR.surface}
          stroke={COLOR.textStrong}
          strokeWidth={1.2}
        />
      </svg>
    </Box>
  );
};

/** A rotate button: a 30px-high half of the row above the north button. */
const RotateButton = ({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) => {
  return (
    <IconButton
      icon={icon}
      aria-label={label}
      onClick={onClick}
      sx={{
        flex: 1,
        height: '30px',
        minWidth: 0,
        borderRadius: '6px',
        backgroundColor: COLOR.fillAlt,
        color: COLOR.textMuted,
        boxShadow: 'none',
        '&:hover': { backgroundColor: COLOR.fill, color: COLOR.textStrong },
      }}
    />
  );
};

/**
 * The back-to-north button's look. Faded while the map already faces north —
 * nothing to undo — and a green call to action once it is turned, so the way
 * back is found where the reader looks for it.
 */
const northAppearance = (atNorth: boolean) => {
  return atNorth
    ? {
        cursor: 'default',
        fontWeight: 400,
        color: COLOR.textFaint,
        backgroundColor: COLOR.fillAlt,
        borderColor: 'transparent',
        hover: {},
      }
    : {
        cursor: 'pointer',
        fontWeight: 500,
        color: COLOR.primaryDark,
        backgroundColor: COLOR.primaryTint,
        borderColor: COLOR.primaryTintBorder,
        hover: { backgroundColor: COLOR.primaryTintStrong },
      };
};

/**
 * A camera-bearing setting: a compass dial with a readout, the ±45° rotate
 * buttons and a back-to-north button.
 *
 * The bearing is published to the shared selection under `menuId` as whole
 * degrees, `0`–`359`, and the app turns it into `view.bearing`. A drag
 * publishes on every snap, so the map follows the needle as it turns. Under a
 * sub-block the readout moves to the heading (`readoutInHeading`), which
 * formats it with {@link useFormatBearing}.
 *
 * @param params.control - The bearing's spec.
 * @param params.readoutInHeading - Leaves the readout to the heading above.
 * @returns The control.
 *
 * @example
 * <BearingSettingControl control={{ kind: 'bearing', menuId: 'bearing', defaultValue: 335 }} />
 */
export const BearingSettingControl = ({
  control,
  readoutInHeading = false,
}: {
  control: GeovisWorkspaceSidebarBearingSetting;
  readoutInHeading?: boolean;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();
  const formatBearing = useFormatBearing();

  const [raw, setRaw] = useSettingValue({
    menuId: control.menuId,
    defaultValue: String(resolveBearing({ control, raw: undefined })),
  });

  const bearing = resolveBearing({ control, raw });
  const step = control.step ?? 5;
  const atNorth = bearing === 0;
  const north = northAppearance(atNorth);

  const commit = (next: number) => {
    setRaw(String(normalizeBearing(next)));
  };

  const readout = formatBearing(bearing);

  return (
    <Box>
      {readoutInHeading ? null : (
        <Text
          sx={{
            display: 'block',
            marginBottom: '10px',
            fontFamily: FONT_MONO,
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: 1,
            color: COLOR.primary,
          }}
        >
          {readout}
        </Text>
      )}

      <Flex sx={{ alignItems: 'center', gap: '12px' }}>
        <Dial
          bearing={bearing}
          step={step}
          label={formatMessage(messages.bearingDial)}
          valueText={readout}
          onChange={commit}
        />

        <Flex
          sx={{ flex: 1, minWidth: 0, flexDirection: 'column', gap: '6px' }}
        >
          <Flex sx={{ gap: '6px' }}>
            <RotateButton
              icon="lucide:rotate-ccw"
              label={formatMessage(messages.bearingRotateLeft)}
              onClick={() => {
                commit(quickStepFrom({ bearing, direction: -1 }));
              }}
            />
            <RotateButton
              icon="lucide:rotate-cw"
              label={formatMessage(messages.bearingRotateRight)}
              onClick={() => {
                commit(quickStepFrom({ bearing, direction: 1 }));
              }}
            />
          </Flex>

          <Box
            as="button"
            {...({ type: 'button', disabled: atNorth } as object)}
            onClick={() => {
              commit(0);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '30px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: north.fontWeight,
              cursor: north.cursor,
              backgroundColor: north.backgroundColor,
              border: '1px solid',
              borderColor: north.borderColor,
              color: north.color,
              transition:
                'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              '&:hover': north.hover,
            }}
          >
            <Icon icon="lucide:compass" style={{ fontSize: '12px' }} />
            <span>{formatMessage(messages.bearingResetNorth)}</span>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};
