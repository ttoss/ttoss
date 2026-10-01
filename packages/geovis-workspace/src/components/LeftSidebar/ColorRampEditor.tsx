import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSidebarColorRampCreate,
  GeovisWorkspaceSidebarColorRampOption,
} from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { ColorPickerCard } from './ColorPickerCard';
import {
  CustomColorButton,
  type PickerTarget,
  ToneRow,
} from './ColorRampTones';
import { rampFromBase } from './rampFromBase';
import { COLOR, FONT_HEAD } from './theme';

/** Classes a built ramp falls back to when neither the spec nor the list says. */
const FALLBACK_CLASSES = 5;

/** A base-color swatch: the ring marks the one the draft is built from. */
const BaseSwatch = ({
  color,
  name,
  on,
  onPick,
}: {
  color: string;
  name: string;
  on: boolean;
  onPick: () => void;
}) => {
  return (
    <Box
      as="button"
      {...({
        type: 'button',
        'aria-label': name,
        'aria-pressed': on,
      } as object)}
      onClick={onPick}
      sx={{
        width: '26px',
        height: '26px',
        padding: 0,
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: color,
        border: `2px solid ${on ? COLOR.surface : 'transparent'}`,
        boxShadow: on
          ? `0 0 0 2px ${COLOR.primary}`
          : `0 0 0 1px ${COLOR.border}`,
      }}
    />
  );
};

/** The editor's heading and the control that closes it without emitting. */
const EditorHeader = ({ onCancel }: { onCancel: () => void }) => {
  const { intl } = useI18n();

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '10px',
      }}
    >
      <Text
        sx={{
          fontFamily: FONT_HEAD,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLOR.textMuted,
        }}
      >
        {intl.formatMessage(messages.chooseBaseColor)}
      </Text>

      <Box
        as="button"
        {...({
          type: 'button',
          'aria-label': intl.formatMessage(messages.cancelColorScale),
        } as object)}
        onClick={onCancel}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          margin: '-2px -4px 0 0',
          borderRadius: '6px',
          border: 0,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: COLOR.textFaint,
        }}
      >
        <Icon icon="lucide:x" style={{ fontSize: '11px' }} />
      </Box>
    </Flex>
  );
};

/** The presets, and the pipette that opens the picker for any other base. */
const BaseColorRow = ({
  baseColors,
  allowCustomColor,
  baseColor,
  pickerOpen,
  onPick,
  onOpenPicker,
}: {
  baseColors: GeovisWorkspaceSidebarColorRampCreate['baseColors'];
  allowCustomColor: boolean;
  baseColor: string;
  /** Whether the picker is up for the base color. */
  pickerOpen: boolean;
  onPick: (color: string) => void;
  onOpenPicker: (anchor: HTMLElement) => void;
}) => {
  return (
    <Flex sx={{ flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
      {baseColors.map((swatch) => {
        return (
          <BaseSwatch
            key={swatch.id}
            color={swatch.color}
            name={swatch.name}
            on={swatch.color.toLowerCase() === baseColor.toLowerCase()}
            onPick={() => {
              onPick(swatch.color);
            }}
          />
        );
      })}

      {allowCustomColor ? (
        <CustomColorButton open={pickerOpen} onToggle={onOpenPicker} />
      ) : null}
    </Flex>
  );
};

/** What the ramp is called, and the commit. */
const NameRow = ({
  name,
  ready,
  onName,
  onCommit,
}: {
  name: string;
  ready: boolean;
  onName: (next: string) => void;
  onCommit: () => void;
}) => {
  const { intl } = useI18n();

  return (
    <Flex sx={{ alignItems: 'center', gap: '6px', marginTop: '10px' }}>
      <input
        type="text"
        value={name}
        placeholder={intl.formatMessage(messages.colorScaleName)}
        aria-label={intl.formatMessage(messages.colorScaleName)}
        onChange={(event) => {
          onName(event.target.value);
        }}
        style={{
          flex: 1,
          minWidth: 0,
          height: '30px',
          borderRadius: '6px',
          padding: '0 9px',
          outline: 'none',
          backgroundColor: COLOR.surface,
          border: `1px solid ${COLOR.border}`,
          color: COLOR.textStrong,
          fontSize: '12px',
        }}
      />

      <Box
        as="button"
        {...({ type: 'button', disabled: !ready } as object)}
        onClick={onCommit}
        sx={{
          flexShrink: 0,
          height: '30px',
          padding: '0 12px',
          borderRadius: '6px',
          border: 0,
          cursor: ready ? 'pointer' : 'not-allowed',
          backgroundColor: ready ? COLOR.primary : COLOR.textDisabled,
          color: COLOR.surface,
          fontFamily: FONT_HEAD,
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {intl.formatMessage(messages.addColorScale)}
      </Box>
    </Flex>
  );
};

/**
 * The name a ramp gets when the reader leaves the field empty: the preset's
 * name with "personalizado" when the base is a preset, its hex code otherwise.
 */
const useDefaultName = ({
  baseColors,
  baseColor,
}: {
  baseColors: GeovisWorkspaceSidebarColorRampCreate['baseColors'];
  baseColor: string;
}): string => {
  const { intl } = useI18n();
  const preset = baseColors.find((swatch) => {
    return swatch.color.toLowerCase() === baseColor.toLowerCase();
  });

  return preset
    ? intl.formatMessage(messages.customColorScaleName, { base: preset.name })
    : baseColor.toUpperCase();
};

/**
 * The ramp being built: its base color, its name, the tones the reader
 * adjusted, and which of them — or the base — the picker is editing.
 *
 * The saved ramp is the one built from the base with the adjustments laid
 * over it, tone by tone. A new base (a preset, or one applied from the
 * picker) builds a new ramp, so it drops every adjustment: they were made
 * against tones that no longer exist.
 *
 * Applying a color to the base also writes its hex code into an empty name
 * field; a later apply replaces its own code, and a name the reader typed is
 * never overwritten.
 */
const useRampDraft = ({
  create,
  classes,
}: {
  create: GeovisWorkspaceSidebarColorRampCreate;
  classes: number;
}) => {
  const { baseColors, rampFrom } = create;
  const [baseColor, setBaseColor] = React.useState<string>(() => {
    return baseColors[0]?.color ?? '#000000';
  });
  const [name, setName] = React.useState('');
  const [tones, setTones] = React.useState<Record<number, string>>({});
  const [picker, setPicker] = React.useState<{
    target: PickerTarget;
    anchor: HTMLElement;
  } | null>(null);
  const autoName = React.useRef<string | null>(null);

  const build = rampFrom ?? rampFromBase;
  const colors = build({ baseColor, classes }).map((color, index) => {
    return tones[index] ?? color;
  });
  const defaultName = useDefaultName({ baseColors, baseColor });

  const pickBase = (color: string) => {
    setBaseColor(color);
    setTones({});
  };

  const applyPicker = (color: string) => {
    const target = picker?.target;
    setPicker(null);
    if (typeof target === 'number') {
      setTones((current) => {
        return { ...current, [target]: color };
      });
      return;
    }
    pickBase(color);
    const hex = color.toUpperCase();
    if (name.trim() === '' || name === autoName.current) {
      setName(hex);
      autoName.current = hex;
    }
  };

  return {
    baseColor,
    name,
    setName,
    colors,
    defaultName,
    adjusted: new Set(Object.keys(tones).map(Number)),
    picker,
    // The target's current color, for the card to open on. A tone can only
    // be opened from the row, so its index is always one of `colors`.
    pickerColor:
      typeof picker?.target === 'number'
        ? (colors[picker.target] as string)
        : baseColor,
    /*
     * A ramp with no classes has nothing to save: an unparseable custom color
     * yields an empty sweep, and saving it would put a blank row in the list.
     */
    ready: colors.length > 0,
    pickBase,
    applyPicker,
    closePicker: () => {
      setPicker(null);
    },
    // A second press on the button that opened the picker closes it.
    togglePicker: (target: PickerTarget, anchor: HTMLElement) => {
      setPicker((current) => {
        return current?.target === target ? null : { target, anchor };
      });
    },
    resetTones: () => {
      setTones({});
    },
  };
};

/**
 * The editor for a ramp the reader builds: a base color, a preview, and a name
 * — optional, defaulting to one drawn from the base (see `useDefaultName`).
 *
 * It replaces the affordance that opened it rather than opening over the panel.
 * The list it is adding to has to stay visible — the reader is choosing a color
 * that has to sit apart from the ones already there, and a modal would hide
 * exactly what that judgement needs.
 *
 * @param params.create - The setting's create spec.
 * @param params.classes - Classes the built ramp has.
 * @param params.onCommit - Called with the finished option; the caller assigns
 *   the id and publishes it.
 * @param params.onCancel - Closes without emitting.
 * @returns The editor.
 *
 * @example
 * <ColorRampEditor create={create} classes={5} onCommit={add} onCancel={close} />
 */
export const ColorRampEditor = ({
  create,
  classes,
  onCommit,
  onCancel,
}: {
  create: GeovisWorkspaceSidebarColorRampCreate;
  classes: number;
  onCommit: (params: {
    option: Omit<GeovisWorkspaceSidebarColorRampOption, 'id'>;
    baseColor: string;
  }) => void;
  onCancel: () => void;
}) => {
  const { baseColors, allowCustomColor = true } = create;
  const draft = useRampDraft({ create, classes });

  return (
    <Box
      sx={{
        marginTop: '6px',
        padding: '12px',
        borderRadius: '16px',
        backgroundColor: COLOR.fillAlt,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      <EditorHeader onCancel={onCancel} />

      <BaseColorRow
        baseColors={baseColors}
        allowCustomColor={allowCustomColor}
        baseColor={draft.baseColor}
        pickerOpen={draft.picker?.target === 'base'}
        onPick={draft.pickBase}
        onOpenPicker={(anchor) => {
          draft.togglePicker('base', anchor);
        }}
      />

      <ToneRow
        colors={draft.colors}
        adjusted={draft.adjusted}
        editing={
          typeof draft.picker?.target === 'number' ? draft.picker.target : null
        }
        onEdit={(index, anchor) => {
          draft.togglePicker(index, anchor);
        }}
        onReset={draft.resetTones}
      />

      <NameRow
        name={draft.name}
        ready={draft.ready}
        onName={draft.setName}
        onCommit={() => {
          onCommit({
            option: {
              label: draft.name.trim() || draft.defaultName,
              colors: draft.colors,
            },
            baseColor: draft.baseColor,
          });
        }}
      />

      {draft.picker ? (
        <ColorPickerCard
          // A fresh card per target, so it opens on that target's color.
          key={String(draft.picker.target)}
          anchor={draft.picker.anchor}
          color={draft.pickerColor}
          onApply={draft.applyPicker}
          onCancel={draft.closePicker}
        />
      ) : null}
    </Box>
  );
};

export { FALLBACK_CLASSES };
