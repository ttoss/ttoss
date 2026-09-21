import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarLocatorFilter } from '../../context/GeovisWorkspaceContext';
import { messages } from '../../messages';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';

type LocatorOption = GeovisWorkspaceSidebarLocatorFilter['options'][number];

export const LocatorRecentSearches = ({
  options,
  onPick,
}: {
  options: LocatorOption[];
  onPick: (option: LocatorOption) => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Box sx={{ marginBottom: '12px' }}>
      <Text
        sx={{
          display: 'block',
          marginBottom: '6px',
          fontFamily: FONT_HEAD,
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLOR.textGhost,
        }}
      >
        {formatMessage(messages.locatorRecent)}
      </Text>

      <Flex sx={{ flexWrap: 'wrap', gap: '5px' }}>
        {options.map((option) => {
          return (
            <Box
              key={option.id}
              as="button"
              {...({ type: 'button' } as object)}
              onMouseDown={() => {
                onPick(option);
              }}
              sx={{
                padding: '5px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                color: COLOR.textMuted,
                backgroundColor: COLOR.fill,
                border: '1px solid transparent',
                transition:
                  'background-color 0.15s ease, border-color 0.15s ease',
                '&:hover': {
                  backgroundColor: COLOR.primaryTint,
                  borderColor: COLOR.primaryTintBorder,
                },
              }}
            >
              {option.label}
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
};

/** The card summarizing the current pick, with its own way out. */
export const LocatorSelectedCard = ({
  option,
  onClear,
}: {
  option: LocatorOption;
  onClear: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
        backgroundColor: COLOR.primaryTint,
        border: `1px solid ${COLOR.primaryTintBorder}`,
      }}
    >
      <Flex
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Text
            sx={{
              display: 'block',
              fontFamily: FONT_HEAD,
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLOR.textFaint,
              marginBottom: '2px',
            }}
          >
            {formatMessage(messages.locatorSelected)}
          </Text>
          <Text
            sx={{ fontSize: '13px', fontWeight: 500, color: COLOR.textStrong }}
          >
            {option.label}
          </Text>
          {option.sublabel ? (
            <Text
              sx={{
                display: 'block',
                fontFamily: FONT_MONO,
                fontSize: '11px',
                color: COLOR.textFaint,
                marginTop: '2px',
              }}
            >
              {option.sublabel}
            </Text>
          ) : null}
        </Box>

        <Box
          as="button"
          {...({ type: 'button' } as object)}
          aria-label={formatMessage(messages.locatorRemoveSelection)}
          onClick={onClear}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: '24px',
            height: '24px',
            margin: '-2px -2px 0 0',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: COLOR.textGhost,
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': { color: COLOR.textMuted, backgroundColor: COLOR.fill },
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: '11px' }} />
        </Box>
      </Flex>

      {option.value ? (
        <Box
          sx={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: `1px solid ${COLOR.primaryTintBorder}`,
          }}
        >
          <Text
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '17px',
              fontWeight: 500,
              lineHeight: 1,
              color: COLOR.primaryDark,
            }}
          >
            {option.value}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};
