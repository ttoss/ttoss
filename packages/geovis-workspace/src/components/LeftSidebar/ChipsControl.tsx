import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarChipsFilter } from '../../context/GeovisWorkspaceContext';
import { COLOR } from './theme';

type ChipOption = GeovisWorkspaceSidebarChipsFilter['options'][number];

/** A single toggle chip; active chips take the coral accent styling. */
const Chip = ({
  option,
  active,
  onToggle,
}: {
  option: ChipOption;
  active: boolean;
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
      {...({ type: 'button' } as object)}
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
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
      {option.label}
    </Box>
  );
};

/**
 * The chips filter: a wrapping row of toggle chips with a "clear" action.
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
  const { options } = control;

  return (
    <Box>
      <Flex sx={{ flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {options.map((option) => {
          return (
            <Chip
              key={option.id}
              option={option}
              active={selected.includes(option.id)}
              onToggle={() => {
                onToggle(option.id);
              }}
            />
          );
        })}
      </Flex>

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
          Limpar {selected.length} filtro{selected.length > 1 ? 's' : ''}
        </Box>
      ) : null}
    </Box>
  );
};
