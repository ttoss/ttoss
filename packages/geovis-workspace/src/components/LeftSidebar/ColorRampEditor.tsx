import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSidebarColorRampCreate,
  GeovisWorkspaceSidebarColorRampOption,
} from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
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

/** The presets, and the free input that reaches past them. */
const BaseColorRow = ({
  baseColors,
  allowCustomColor,
  baseColor,
  onPick,
}: {
  baseColors: GeovisWorkspaceSidebarColorRampCreate['baseColors'];
  allowCustomColor: boolean;
  baseColor: string;
  onPick: (color: string) => void;
}) => {
  const { intl } = useI18n();

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
        <Box
          as="label"
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: COLOR.surface,
            border: `1px dashed ${COLOR.textDisabled}`,
            color: COLOR.textFaint,
          }}
        >
          <Icon icon="lucide:pipette" style={{ fontSize: '12px' }} />
          <input
            type="color"
            value={baseColor}
            aria-label={intl.formatMessage(messages.customColor)}
            onChange={(event) => {
              onPick(event.target.value);
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </Box>
      ) : null}
    </Flex>
  );
};

/** The sweep the chosen base would add, drawn as one strip. */
const RampPreview = ({ colors }: { colors: string[] }) => {
  return (
    <Flex
      aria-hidden
      sx={{
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: `0 0 0 1px ${COLOR.border}`,
      }}
    >
      {colors.map((color, index) => {
        return (
          <Box
            // The sweep may repeat a color, so the index is what stays stable.
            key={`${color}-${index}`}
            sx={{ flex: 1, height: '22px', backgroundColor: color }}
          />
        );
      })}
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
 * The editor for a ramp the reader builds: a base color, a preview, and a name.
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
  const { baseColors, allowCustomColor = true, rampFrom } = create;

  const [baseColor, setBaseColor] = React.useState<string>(() => {
    return baseColors[0]?.color ?? '#000000';
  });
  const [name, setName] = React.useState('');

  const build = rampFrom ?? rampFromBase;
  const colors = build({ baseColor, classes });

  /*
   * A ramp with no classes has nothing to save: an unparseable custom color
   * yields an empty sweep, and saving it would put a nameless blank row in the
   * list. The button goes quiet instead of failing after the fact.
   */
  const ready = name.trim().length > 0 && colors.length > 0;

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
        baseColor={baseColor}
        onPick={setBaseColor}
      />

      <RampPreview colors={colors} />

      <NameRow
        name={name}
        ready={ready}
        onName={setName}
        onCommit={() => {
          onCommit({ option: { label: name.trim(), colors }, baseColor });
        }}
      />
    </Box>
  );
};

export { FALLBACK_CLASSES };
