import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarLocatorFilter } from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { splitMatch } from './locatorMatch';
import { COLOR, FONT_MONO } from './theme';

type LocatorOption = GeovisWorkspaceSidebarLocatorFilter['options'][number];

const ResultRow = ({
  option,
  query,
  id,
  cursored,
  onPick,
  onHover,
}: {
  option: LocatorOption;
  query: string;
  id: string;
  cursored: boolean;
  onPick: () => void;
  onHover: () => void;
}) => {
  const { pre, hit, post } = splitMatch({ label: option.label, query });

  /*
   * The name is spelled out rather than left to the label's own text: marking
   * the matched run splits it across elements, and the accessible name built
   * from those parts comes out as "San tos". The highlight is decoration — what
   * is announced is the place, and the figure that goes with it.
   */
  const name = option.value ? `${option.label}, ${option.value}` : option.label;

  return (
    <Box
      as="button"
      {...({
        type: 'button',
        role: 'option',
        'aria-selected': cursored,
      } as object)}
      id={id}
      aria-label={name}
      onMouseDown={onPick}
      onMouseEnter={onHover}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        textAlign: 'left',
        paddingX: '12px',
        paddingY: '8px',
        border: 'none',
        // The rule is what marks the keyboard cursor, so it must hold the row's
        // width whether or not the row is the cursored one.
        borderLeft: `2px solid ${cursored ? COLOR.primary : 'transparent'}`,
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'background-color 0.12s ease, color 0.12s ease',
        backgroundColor: cursored ? COLOR.primaryTint : 'transparent',
        color: cursored ? COLOR.primary : COLOR.textMuted,
      }}
    >
      <Text sx={{ flex: 1, minWidth: 0 }}>
        {pre}
        {hit ? (
          <Text
            as="span"
            sx={{
              fontWeight: 600,
              borderRadius: '2px',
              color: COLOR.primaryDark,
              backgroundColor: COLOR.primaryTint,
            }}
          >
            {hit}
          </Text>
        ) : null}
        {post}
      </Text>

      {option.value ? (
        <Text
          sx={{
            flexShrink: 0,
            fontFamily: FONT_MONO,
            fontSize: '10px',
            color: COLOR.textFaint,
          }}
        >
          {option.value}
        </Text>
      ) : null}
    </Box>
  );
};

/** The results dropdown. */
export const LocatorResults = ({
  options,
  query,
  listboxId,
  optionId,
  cursor,
  onPick,
  onHover,
}: {
  options: LocatorOption[];
  query: string;
  listboxId: string;
  optionId: (index: number) => string;
  cursor: number;
  onPick: (option: LocatorOption) => void;
  onHover: (index: number) => void;
}) => {
  return (
    <Box
      id={listboxId}
      role="listbox"
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        overflowY: 'auto',
        maxHeight: '168px',
        marginBottom: '12px',
        backgroundColor: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        scrollbarWidth: 'none',
        '::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {options.map((option, index) => {
        return (
          <ResultRow
            key={option.id}
            option={option}
            query={query}
            id={optionId(index)}
            cursored={index === cursor}
            onPick={() => {
              onPick(option);
            }}
            onHover={() => {
              onHover(index);
            }}
          />
        );
      })}
    </Box>
  );
};

/** Shown in place of the dropdown when a long-enough query matches nothing. */
export const LocatorNoResults = ({ query }: { query: string }) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        padding: '10px 12px',
        borderRadius: '6px',
        backgroundColor: COLOR.fill,
      }}
    >
      <Box sx={{ display: 'flex', flexShrink: 0, color: COLOR.textGhost }}>
        <Icon icon="lucide:search-x" style={{ fontSize: '13px' }} />
      </Box>
      <Text sx={{ fontSize: '11px', lineHeight: 1.45, color: COLOR.textMuted }}>
        {formatMessage(messages.locatorNoResults, { query })}
      </Text>
    </Flex>
  );
};
