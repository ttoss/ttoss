import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';

import type {
  GeovisWorkspaceSidebarSliderSetting,
  GeovisWorkspaceSidebarSliderStop,
} from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';
import { useSettingValue } from './useSettingValue';

/** A square 28×28 icon button under the track, matching the timeline's. */
const SliderStep = ({
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

/** What the range input spans, and how a position on it maps back to a value. */
type Track = {
  min: number;
  max: number;
  step: number;
  /** Where the handle sits — a rung index on a ladder, the value itself otherwise. */
  position: number;
  /** The rung the handle rests on; absent on a continuous track. */
  current?: GeovisWorkspaceSidebarSliderStop;
  toValue: (position: number) => number;
};

/**
 * Resolves the track from the control and the value it currently holds.
 *
 * A ladder's track runs over rung *indices*, not over the rungs' own values:
 * they are ordered but need not be evenly spaced, and a track keyed on the
 * values would bunch the handle wherever they crowd together. A continuous
 * track is the value itself, over the control's bounds or their defaults.
 *
 * @param params.control - The slider's spec.
 * @param params.value - The value held for it.
 * @returns The track.
 *
 * @example
 * resolveTrack({ control, value: 80 }).position; // the rung's index
 */
const resolveTrack = ({
  control,
  value,
}: {
  control: GeovisWorkspaceSidebarSliderSetting;
  value: number;
}): Track => {
  const { stops } = control;

  if (stops && stops.length > 0) {
    // A value off the ladder (a stale permalink, say) rests on the first rung
    // rather than leaving the handle nowhere.
    const index = Math.max(
      0,
      stops.findIndex((stop) => {
        return stop.value === value;
      })
    );

    return {
      min: 0,
      max: stops.length - 1,
      step: 1,
      position: index,
      current: stops[index],
      toValue: (position) => {
        return stops[position].value;
      },
    };
  }

  return {
    min: control.min ?? 0,
    max: control.max ?? 100,
    step: control.step ?? 1,
    position: value,
    toValue: (position) => {
      return position;
    },
  };
};

/** The value the handle rests on, with a rung's secondary readout beside it. */
const Readout = ({ text, hint }: { text: string; hint?: string }) => {
  return (
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
          fontSize: hint === undefined ? '13px' : '15px',
          fontWeight: 500,
          color: COLOR.primary,
          lineHeight: 1,
        }}
      >
        {text}
      </Text>

      {hint === undefined ? null : (
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '11px',
            color: COLOR.textFaint,
          }}
        >
          {hint}
        </Text>
      )}
    </Flex>
  );
};

/**
 * The row under the track: the steppers at the ends with the scale's caption
 * between them.
 *
 * The steppers sit here rather than flanking the track, so the track keeps the
 * full width it needs to be dragged accurately. Each button is on the side it
 * moves the handle towards, and the two are the same size, so `space-between`
 * centres the caption without a spacer. Absent entirely when the control asked
 * for neither.
 */
const ScaleRow = ({
  caption,
  stepButtons,
  onStep,
}: {
  caption?: string;
  stepButtons: boolean;
  onStep: (direction: 1 | -1) => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  if (!stepButtons && caption === undefined) {
    return null;
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '10px',
      }}
    >
      {stepButtons ? (
        <SliderStep
          icon="lucide:minus"
          label={formatMessage(messages.settingDecrease)}
          onClick={() => {
            onStep(-1);
          }}
        />
      ) : null}

      {caption === undefined ? null : (
        <Text
          sx={{
            fontFamily: FONT_HEAD,
            fontSize: '9px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: COLOR.textGhost,
          }}
        >
          {caption}
        </Text>
      )}

      {stepButtons ? (
        <SliderStep
          icon="lucide:plus"
          label={formatMessage(messages.settingIncrease)}
          onClick={() => {
            onStep(1);
          }}
        />
      ) : null}
    </Flex>
  );
};

/**
 * A numeric setting: a ladder when the control carries `stops`, a continuous
 * range otherwise.
 *
 * A ladder reads its rung's label (and hint) above the track; a range reads its
 * own number with the unit. Either way the value is published to the shared
 * selection under `menuId`, so the app redraws from it.
 *
 * @param params.control - The slider's spec.
 * @returns The control.
 *
 * @example
 * <SliderSettingControl control={{ kind: 'slider', menuId: 'opacity', defaultValue: 85 }} />
 */
export const SliderSettingControl = ({
  control,
}: {
  control: GeovisWorkspaceSidebarSliderSetting;
}) => {
  const [raw, setRaw] = useSettingValue({
    menuId: control.menuId,
    defaultValue: String(control.defaultValue),
  });

  const value = Number(raw);
  const { unit, endLabels, stepButtons = false } = control;

  const track = resolveTrack({ control, value });

  const commit = (next: number) => {
    const clamped = Math.min(track.max, Math.max(track.min, next));
    setRaw(String(track.toValue(clamped)));
  };

  // Assembled outside the JSX: both read as untranslated copy to the i18n lint
  // rule, though both are built from what the consumer declared rather than
  // from any string this package owns.
  const readout = track.current ? track.current.label : `${value}${unit ?? ''}`;
  const caption = endLabels ? `${endLabels[0]} — ${endLabels[1]}` : undefined;

  return (
    <Box>
      <Readout text={readout} hint={track.current?.hint} />

      <input
        type="range"
        min={track.min}
        max={track.max}
        step={track.step}
        value={track.position}
        onChange={(event) => {
          commit(Number(event.target.value));
        }}
        style={{
          display: 'block',
          width: '100%',
          margin: 0,
          cursor: 'pointer',
          accentColor: COLOR.primary,
        }}
      />

      <ScaleRow
        caption={caption}
        stepButtons={stepButtons}
        onStep={(direction) => {
          commit(track.position + direction * track.step);
        }}
      />
    </Box>
  );
};
