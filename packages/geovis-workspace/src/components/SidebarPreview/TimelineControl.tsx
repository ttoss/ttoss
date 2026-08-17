import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarTimelineFilter } from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';

type TimelineHistogram = NonNullable<
  GeovisWorkspaceSidebarTimelineFilter['histogram']
>;

/** A square 28×28 icon button used by the timeline steppers. */
const TimelineStep = ({
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
        width: '28px',
        height: '28px',
        minWidth: 'auto',
        borderRadius: '4px',
        backgroundColor: COLOR.fillAlt,
        color: COLOR.textFaint,
        boxShadow: 'none',
        '&:hover': { backgroundColor: COLOR.fill, color: COLOR.textMuted },
      }}
    />
  );
};

/** The mini histogram: one clickable bar per entry, colored by position. */
const Histogram = ({
  histogram,
  value,
  onChange,
}: {
  histogram: TimelineHistogram;
  value: number;
  onChange: (next: number) => void;
}) => {
  const maxCount = Math.max(
    ...histogram.map((entry) => {
      return entry.count;
    })
  );

  return (
    <Flex
      sx={{
        alignItems: 'flex-end',
        gap: '1px',
        height: '40px',
        marginBottom: '12px',
      }}
    >
      {histogram.map((entry) => {
        const height = Math.round((entry.count / maxCount) * 100);
        const backgroundColor =
          entry.key === value
            ? COLOR.primary
            : entry.key <= value
              ? COLOR.primarySoft
              : 'rgba(0,0,0,0.08)';

        return (
          <Box
            key={entry.key}
            as="button"
            {...({
              type: 'button',
              title: `${entry.key}: ${entry.count}`,
            } as object)}
            onClick={() => {
              onChange(entry.key);
            }}
            sx={{
              flex: 1,
              height: `${height}%`,
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              padding: 0,
              transition: 'background-color 0.15s ease',
              backgroundColor,
            }}
          />
        );
      })}
    </Flex>
  );
};

/** The play/pause toggle centered between the steppers. */
const PlayButton = ({
  playing,
  onTogglePlay,
}: {
  playing: boolean;
  onTogglePlay: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const stateSx = playing
    ? {
        backgroundColor: COLOR.primaryTint,
        color: COLOR.primary,
        border: `1px solid ${COLOR.primaryTintBorder}`,
        '&:hover': {},
      }
    : {
        backgroundColor: COLOR.fillAlt,
        color: COLOR.textMuted,
        border: '1px solid transparent',
        '&:hover': { backgroundColor: COLOR.fill },
      };

  return (
    <Box
      as="button"
      {...({ type: 'button' } as object)}
      onClick={onTogglePlay}
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height: '28px',
        borderRadius: '4px',
        fontFamily: FONT_HEAD,
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ...stateSx,
      }}
    >
      <Icon
        icon={playing ? 'lucide:pause' : 'lucide:play'}
        style={{ fontSize: '11px' }}
      />
      {playing ? formatMessage(messages.pause) : formatMessage(messages.play)}
    </Box>
  );
};

/**
 * The timeline filter: histogram + big value readout + range slider + a
 * prev / play-pause / next row. Play/pause and the current value are lifted to
 * the sidebar so the footer and auto-advance can share them.
 */
export const TimelineControl = ({
  control,
  value,
  onChange,
  playing,
  onTogglePlay,
}: {
  control: GeovisWorkspaceSidebarTimelineFilter;
  value: number;
  onChange: (next: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}) => {
  const { min, max, step = 1, histogram, unitLabel } = control;

  const currentEntry = histogram?.find((entry) => {
    return entry.key === value;
  });

  return (
    <Box>
      {histogram && histogram.length > 0 ? (
        <Histogram histogram={histogram} value={value} onChange={onChange} />
      ) : null}

      <Flex
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '26px',
            fontWeight: 500,
            color: COLOR.primary,
            lineHeight: 1,
          }}
        >
          {value}
        </Text>
        {currentEntry && unitLabel ? (
          <Text
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '11px',
              color: COLOR.textFaint,
            }}
          >
            {currentEntry.count} {unitLabel}
          </Text>
        ) : null}
      </Flex>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        style={{ width: '100%', cursor: 'pointer', accentColor: COLOR.primary }}
      />

      <Flex
        sx={{
          justifyContent: 'space-between',
          marginTop: '4px',
          marginBottom: '16px',
        }}
      >
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '10px',
            color: COLOR.textGhost,
          }}
        >
          {min}
        </Text>
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '10px',
            color: COLOR.textGhost,
          }}
        >
          {max}
        </Text>
      </Flex>

      <Flex sx={{ alignItems: 'center', gap: '8px' }}>
        <TimelineStep
          icon="lucide:chevron-left"
          label={String(min)}
          onClick={() => {
            onChange(Math.max(min, value - step));
          }}
        />

        <PlayButton playing={playing} onTogglePlay={onTogglePlay} />

        <TimelineStep
          icon="lucide:chevron-right"
          label={String(max)}
          onClick={() => {
            onChange(Math.min(max, value + step));
          }}
        />
      </Flex>
    </Box>
  );
};
