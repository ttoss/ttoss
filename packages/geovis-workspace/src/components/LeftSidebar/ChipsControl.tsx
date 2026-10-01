import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';
import type * as React from 'react';

import type {
  GeovisWorkspaceSidebarChipsFilter,
  GeovisWorkspaceSidebarChipsLayout,
} from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { COLOR } from './theme';

type ChipOption = GeovisWorkspaceSidebarChipsFilter['options'][number];

/**
 * A single toggle chip; active chips take the coral accent styling.
 *
 * With `fill` it takes its grid cell's whole width and cuts its label with an
 * ellipsis instead of wrapping it, so a long label cannot make its row taller
 * than the rest; the full label stays readable as the chip's tooltip.
 */
const Chip = ({
  option,
  active,
  fill,
  onToggle,
}: {
  option: ChipOption;
  active: boolean;
  fill: boolean;
  onToggle: () => void;
}) => {
  const chipSx = active
    ? {
        backgroundColor: 'rgba(217,119,6,0.1)',
        border: '1px solid rgba(217,119,6,0.3)',
        color: COLOR.chipAccentText,
        '&:hover': { backgroundColor: 'rgba(217,119,6,0.1)' },
      }
    : {
        backgroundColor: COLOR.fill,
        border: '1px solid transparent',
        color: COLOR.textMuted,
        '&:hover': { backgroundColor: '#E4DED3' },
      };

  return (
    <Box
      as="button"
      {...({
        type: 'button',
        title: fill ? option.label : undefined,
      } as object)}
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        ...(fill ? { width: '100%', minWidth: 0 } : {}),
        paddingX: '10px',
        paddingY: '6px',
        borderRadius: '6px',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ...chipSx,
      }}
    >
      {option.emoji ? (
        <Box as="span" sx={{ fontSize: '12px' }}>
          {option.emoji}
        </Box>
      ) : option.icon ? (
        <Icon icon={option.icon} style={{ fontSize: '12px' }} />
      ) : null}
      {fill ? (
        <Box
          as="span"
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {option.label}
        </Box>
      ) : (
        option.label
      )}
    </Box>
  );
};

/**
 * Column count of a grid layout, as a whole number of at least 1: a config
 * value of `0`, a negative, `NaN` or a fraction would otherwise collapse the
 * grid or throw it out of shape.
 *
 * @param columns - The declared column count.
 * @returns The count the grid is drawn with.
 *
 * @example
 * resolveColumns(2.7); // 2
 * resolveColumns(0); // 1
 */
export const resolveColumns = (columns: number): number => {
  const whole = Math.floor(columns);

  return Number.isFinite(whole) && whole >= 1 ? whole : 1;
};

/** The chips' container: a wrapping flex row, or a grid of equal columns. */
const ChipsLayout = ({
  layout,
  children,
}: {
  layout?: GeovisWorkspaceSidebarChipsLayout;
  children: React.ReactNode;
}) => {
  if (layout?.kind === 'grid') {
    return (
      <Box
        sx={{
          display: 'grid',
          // `minmax(0, 1fr)`, not `1fr`: a bare `1fr` floors at the content's
          // width, so one long label would widen its column past the others.
          gridTemplateColumns: `repeat(${resolveColumns(layout.columns)}, minmax(0, 1fr))`,
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Flex sx={{ flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
      {children}
    </Flex>
  );
};

/**
 * The chips filter: toggle chips — a wrapping row by default, or a grid of
 * equal columns with `layout: { kind: 'grid', columns }` — and a "clear" action.
 * Controlled — its selection lives in the sidebar so the tab-bar badge can
 * count the active chips.
 */
export const ChipsControl = ({
  control,
  selected,
  onToggle,
  onClear,
}: {
  control: GeovisWorkspaceSidebarChipsFilter;
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();
  const { options, layout } = control;
  const fill = layout?.kind === 'grid';

  return (
    <Box>
      <ChipsLayout layout={layout}>
        {options.map((option) => {
          return (
            <Chip
              key={option.id}
              option={option}
              active={selected.includes(option.id)}
              fill={fill}
              onToggle={() => {
                onToggle(option.id);
              }}
            />
          );
        })}
      </ChipsLayout>

      {selected.length > 0 ? (
        <Box
          as="button"
          {...({ type: 'button' } as object)}
          onClick={onClear}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontSize: '11px',
            color: COLOR.textGhost,
            transition: 'color 0.15s ease',
            '&:hover': { color: COLOR.textMuted },
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: '10px' }} />
          {formatMessage(messages.clearFilters, { count: selected.length })}
        </Box>
      ) : null}
    </Box>
  );
};
