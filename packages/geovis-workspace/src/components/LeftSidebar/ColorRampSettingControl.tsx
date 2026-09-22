import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSidebarColorRampCreate,
  GeovisWorkspaceSidebarColorRampOption,
  GeovisWorkspaceSidebarColorRampSetting,
} from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { ColorRampEditor, FALLBACK_CLASSES } from './ColorRampEditor';
import { COLOR } from './theme';
import { useSettingValue } from './useSettingValue';

/**
 * The ramp's classes, drawn as one strip.
 *
 * The swatches sit flush against each other inside a clipped, hairlined box:
 * gaps between them would read as four colors that happen to be listed
 * together, where the point is the sweep from one end to the other. The hairline
 * is what keeps a pale first class off a pale surface.
 */
const RampStrip = ({ colors }: { colors: string[] }) => {
  return (
    <Flex
      sx={{
        flexShrink: 0,
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: `0 0 0 1px ${COLOR.border}`,
      }}
    >
      {colors.map((color, index) => {
        return (
          <Box
            // Colors are the identity here and a ramp may repeat one, so the
            // index is what stays stable across a re-render.
            key={`${color}-${index}`}
            sx={{ width: '15px', height: '15px', backgroundColor: color }}
          />
        );
      })}
    </Flex>
  );
};

/** One ramp: its strip, its name, and a check once it is the chosen one. */
const RampRow = ({
  option,
  on,
  onSelect,
  onRemove,
}: {
  option: GeovisWorkspaceSidebarColorRampOption;
  on: boolean;
  onSelect: () => void;
  /** Present only when the row is the reader's to dismiss. */
  onRemove?: () => void;
}) => {
  const { intl } = useI18n();

  return (
    <Box
      as="button"
      {...({ type: 'button', 'aria-pressed': on } as object)}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '7px 9px',
        borderRadius: '7px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        backgroundColor: on ? COLOR.primaryTint : 'transparent',
        border: `1px solid ${on ? COLOR.primaryTintBorder : 'transparent'}`,
        '&:hover': { backgroundColor: on ? COLOR.primaryTint : COLOR.fill },
      }}
    >
      <RampStrip colors={option.colors} />

      <Text
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '12px',
          fontWeight: on ? 500 : 400,
          color: on ? COLOR.textStrong : COLOR.textMuted,
        }}
      >
        {option.label}
      </Text>

      {on ? (
        <Icon
          icon="lucide:check"
          style={{ flexShrink: 0, fontSize: '12px', color: COLOR.primary }}
        />
      ) : null}

      {onRemove ? (
        /*
         * Nested inside the row's button, so it stops the pick: dismissing a
         * ramp must not first make it the active one. `as="span"` with a button
         * role keeps the markup valid — a button inside a button is not.
         */
        <Box
          as="span"
          {...({
            role: 'button',
            tabIndex: 0,
            'aria-label': intl.formatMessage(messages.removeColorScale),
          } as object)}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            onRemove();
          }}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          sx={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            marginRight: '-4px',
            borderRadius: '5px',
            cursor: 'pointer',
            color: COLOR.textFaint,
            '&:hover': { backgroundColor: COLOR.fill, color: COLOR.textMuted },
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: '11px' }} />
        </Box>
      ) : null}
    </Box>
  );
};

/** The affordance that opens the editor: a slot, drawn as one. */
const NewRampButton = ({ onOpen }: { onOpen: () => void }) => {
  const { intl } = useI18n();

  return (
    <Box
      as="button"
      {...({ type: 'button' } as object)}
      onClick={onOpen}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        marginTop: '6px',
        padding: '8px 9px',
        borderRadius: '7px',
        cursor: 'pointer',
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: `1px dashed ${COLOR.textDisabled}`,
        color: COLOR.textMuted,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          backgroundColor: COLOR.fill,
          borderColor: COLOR.textGhost,
        },
      }}
    >
      <Icon
        icon="lucide:plus"
        style={{ flexShrink: 0, fontSize: '12px', color: COLOR.textFaint }}
      />
      <Text sx={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
        {intl.formatMessage(messages.newColorScale)}
      </Text>
    </Box>
  );
};

/**
 * How many classes a built ramp gets.
 *
 * The list's own width unless the spec names one, so a new ramp is read at the
 * same resolution as the ones beside it. An empty list has no width to match,
 * which is what the constant is for.
 *
 * @param params.create - The create spec.
 * @param params.options - The ramps already listed.
 * @returns The class count.
 *
 * @example
 * rampClasses({ create, options }); // 4, matching the list
 */
const rampClasses = ({
  create,
  options,
}: {
  create: GeovisWorkspaceSidebarColorRampCreate;
  options: GeovisWorkspaceSidebarColorRampOption[];
}): number => {
  return create.classes ?? options[0]?.colors.length ?? FALLBACK_CLASSES;
};

/**
 * An id no ramp in the list holds.
 *
 * Built here rather than by the app because the control publishes it to the
 * selection on the same commit that reports the ramp — the app would have to
 * send its id back through a channel that carries one string per key.
 *
 * @param options - The ramps already listed.
 * @returns The id.
 *
 * @example
 * nextRampId([{ id: 'custom-1', label: 'Mine', colors: [] }]); // 'custom-2'
 */
const nextRampId = (
  options: GeovisWorkspaceSidebarColorRampOption[]
): string => {
  const taken = new Set(
    options.map((option) => {
      return option.id;
    })
  );

  let index = options.length + 1;

  while (taken.has(`custom-${index}`)) index += 1;

  return `custom-${index}`;
};

/**
 * A color-ramp setting: the ramps listed one per row, the chosen one marked.
 *
 * The check rather than the dot a variation row uses: the row already carries
 * its own colors, and a colored dot beside four colored swatches reads as a
 * fifth. The chosen ramp's `id` is published to the shared selection under
 * `menuId`, so the app repaints from it — the `colors` stay in the config the
 * app already holds, rather than being sent through a selection that holds one
 * string per key.
 *
 * @param params.control - The ramp list's spec.
 * @param params.label - The block's title, naming the list for assistive tech.
 * @returns The control.
 *
 * @example
 * <ColorRampSettingControl control={{ kind: 'colorRamp', menuId: 'ramp', options }} label="Mesh color" />
 */
export const ColorRampSettingControl = ({
  control,
  label,
}: {
  control: GeovisWorkspaceSidebarColorRampSetting;
  label: string;
}) => {
  const { options, create, onRemove } = control;

  const [editing, setEditing] = React.useState(false);

  const [raw, setRaw] = useSettingValue({
    menuId: control.menuId,
    defaultValue: control.defaultValue ?? options[0]?.id ?? '',
  });

  /*
   * An id matching no option — a stale permalink, or a ramp dropped from the
   * config — rests on the first one rather than leaving the list with nothing
   * marked and the map painted by a ramp the user cannot see selected.
   */
  const chosen =
    options.find((option) => {
      return option.id === raw;
    }) ?? options[0];

  return (
    <Box>
      <Flex
        role="group"
        aria-label={label}
        sx={{ flexDirection: 'column', gap: '4px' }}
      >
        {options.map((option) => {
          return (
            <RampRow
              key={option.id}
              option={option}
              on={option.id === chosen?.id}
              onSelect={() => {
                setRaw(option.id);
              }}
              onRemove={
                option.removable && onRemove
                  ? () => {
                      return onRemove({ id: option.id });
                    }
                  : undefined
              }
            />
          );
        })}
      </Flex>

      {create && !editing ? (
        <NewRampButton
          onOpen={() => {
            setEditing(true);
          }}
        />
      ) : null}

      {create && editing ? (
        <ColorRampEditor
          create={create}
          classes={rampClasses({ create, options })}
          onCancel={() => {
            setEditing(false);
          }}
          onCommit={({ option, baseColor }) => {
            const id = nextRampId(options);

            setEditing(false);
            // Published before the app is told, so the ramp the reader just
            // built is the active one by the time the new list arrives.
            setRaw(id);
            create.onCreate({
              option: { ...option, id, removable: true },
              baseColor,
            });
          }}
        />
      ) : null}
    </Box>
  );
};
