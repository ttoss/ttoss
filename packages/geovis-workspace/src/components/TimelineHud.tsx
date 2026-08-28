import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';

import { useTimelineContext } from '../context/TimelineContext';
import { messages } from '../messages';
import { COLOR, FONT_MONO } from './LeftSidebar/theme';

/** Touch-target size for the HUD's controls, against 28px in the sidebar. */
const CONTROL_SIZE = '44px';

/** Square stepper matching the HUD's touch sizing. Neutral, so the play button
 * beside it reads as the one action. */
const HudButton = ({
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
        flexShrink: 0,
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        minWidth: 'auto',
        borderRadius: '10px',
        border: 'none',
        boxShadow: 'none',
        backgroundColor: COLOR.fillAlt,
        color: COLOR.textFaint,
      }}
    />
  );
};

/**
 * The play/pause control, carrying the brand green in both states so it stands
 * out as the bar's primary action: solid while idle — the thing to press — and
 * tinted while running, which keeps the two states apart without going grey.
 */
const HudPlayButton = ({
  playing,
  label,
  onClick,
}: {
  playing: boolean;
  label: string;
  onClick: () => void;
}) => {
  return (
    <IconButton
      icon={playing ? 'lucide:pause' : 'lucide:play'}
      aria-label={label}
      onClick={onClick}
      sx={{
        flexShrink: 0,
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        minWidth: 'auto',
        borderRadius: '10px',
        border: playing ? `1px solid ${COLOR.primaryTintBorder}` : 'none',
        boxShadow: 'none',
        backgroundColor: playing ? COLOR.primaryTint : COLOR.primary,
        color: playing ? COLOR.primary : '#ffffff',
      }}
    />
  );
};

/**
 * Beyond this many steps the segments would be sub-pixel, so the rule stops
 * being drawn rather than turning into mush. A timeline of years or months
 * never comes close.
 */
const MAX_RULE_SEGMENTS = 48;

/**
 * The timeline flattened to a 3px rule: one segment per step, in the same three
 * states as the sidebar's histogram — filled at the current value, tinted
 * behind it, faint ahead.
 *
 * Derived from `min`/`max`/`step`, deliberately not from `histogram`. The rule
 * is flat, so it draws no counts at all; it only says where in the range
 * playback sits, which the range itself already answers. Gating it on histogram
 * data it never renders would hide it from every timeline that has none.
 */
const HudRule = ({
  min,
  max,
  step,
  value,
  onPick,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onPick: (next: number) => void;
}) => {
  const count = Math.floor((max - min) / step) + 1;

  if (count < 2 || count > MAX_RULE_SEGMENTS) return null;

  const steps = Array.from({ length: count }, (_, index) => {
    return min + index * step;
  });

  return (
    <Flex sx={{ height: '3px', gap: '1px', marginTop: '7px' }}>
      {steps.map((entry) => {
        return (
          <Box
            key={entry}
            as="button"
            {...({ type: 'button', title: String(entry) } as object)}
            onClick={() => {
              onPick(entry);
            }}
            sx={{
              flex: 1,
              border: 'none',
              borderRadius: '1px',
              cursor: 'pointer',
              padding: 0,
              backgroundColor:
                entry === value
                  ? COLOR.primary
                  : entry <= value
                    ? COLOR.primarySoft
                    : 'rgba(0,0,0,0.08)',
            }}
          />
        );
      })}
    </Flex>
  );
};

/**
 * Timeline controls as a bar anchored to the bottom of the map, for the compact
 * layout only.
 *
 * Pressing play below the breakpoint takes the sidebar away (`closeOnPlay`),
 * which is the point — the map is what the time-lapse animates. But it would
 * also take the pause button with it, leaving playback running with no way to
 * stop it. This is that way: the current value, a flattened histogram to show
 * where in the range playback sits, and prev / play-pause / next at touch size.
 *
 * It appears once play has been pressed and stays through pausing, so the
 * control that resumes is still there. Dismissing hides it until the next play.
 * Above the breakpoint it never renders — the sidebar is beside the map there,
 * so its own timeline control is always reachable.
 *
 * @param onDismiss - Called when the close button is pressed.
 * @returns The bar, or `null` when there is no timeline to drive.
 *
 * @example
 * ```tsx
 * <TimelineHud onDismiss={() => setDismissed(true)} />
 * ```
 */
export const TimelineHud = ({ onDismiss }: { onDismiss: () => void }) => {
  const { intl } = useI18n();
  const timeline = useTimelineContext();

  if (!timeline.filter) return null;

  const { filter, value, playing, togglePlay, setValue } = timeline;
  const min = filter.min;
  const max = filter.max;
  const step = filter.step ?? 1;
  const count = filter.histogram?.find((entry) => {
    return entry.key === value;
  })?.count;

  const stopAt = (next: number) => {
    if (playing) togglePlay();
    setValue(next);
  };

  return (
    <Flex
      sx={{
        position: 'absolute',
        zIndex: 3,
        bottom: '14px',
        left: '14px',
        right: '14px',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 6px 6px 12px',
        borderRadius: '14px',
        backgroundColor: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Flex sx={{ alignItems: 'baseline', gap: '8px' }}>
          <Text
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '22px',
              fontWeight: 500,
              lineHeight: 1,
              color: COLOR.primary,
            }}
          >
            {value}
          </Text>
          {count != null && (
            <Text
              sx={{
                fontFamily: FONT_MONO,
                fontSize: '10px',
                color: COLOR.textMuted,
              }}
            >
              {intl.formatMessage(messages.timelineHudCount, { count })}
            </Text>
          )}
        </Flex>
        <HudRule
          min={min}
          max={max}
          step={step}
          value={value}
          onPick={stopAt}
        />
      </Box>

      <HudButton
        icon="lucide:chevron-left"
        label={intl.formatMessage(messages.timelineHudPrevious)}
        onClick={() => {
          stopAt(Math.max(min, value - step));
        }}
      />
      <HudPlayButton
        playing={playing}
        label={intl.formatMessage(playing ? messages.pause : messages.play)}
        onClick={togglePlay}
      />
      <HudButton
        icon="lucide:chevron-right"
        label={intl.formatMessage(messages.timelineHudNext)}
        onClick={() => {
          stopAt(Math.min(max, value + step));
        }}
      />

      <IconButton
        icon="lucide:x"
        aria-label={intl.formatMessage(messages.timelineHudClose)}
        onClick={onDismiss}
        sx={{
          flexShrink: 0,
          width: '30px',
          height: CONTROL_SIZE,
          minWidth: 'auto',
          border: 'none',
          borderRadius: '10px',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          color: COLOR.textGhost,
        }}
      />
    </Flex>
  );
};
