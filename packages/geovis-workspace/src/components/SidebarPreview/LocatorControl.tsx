import { Icon } from '@ttoss/react-icons';
import { Box, Text } from '@ttoss/ui';
import * as React from 'react';

import type { GeovisWorkspaceSidebarLocatorFilter } from '../../context/GeovisWorkspaceContext';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';

type LocatorOption = GeovisWorkspaceSidebarLocatorFilter['options'][number];

/** The search field with its leading icon and inline clear button. */
const SearchInput = ({
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  onClear,
}: {
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
}) => {
  return (
    <Box sx={{ position: 'relative', marginBottom: '8px' }}>
      <Box
        sx={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        <Icon
          icon="lucide:search"
          style={{ fontSize: '12px', color: COLOR.textGhost }}
        />
      </Box>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%',
          borderRadius: '6px',
          padding: '8px 32px',
          outline: 'none',
          background: COLOR.fill,
          border: `1px solid ${COLOR.border}`,
          color: COLOR.textStrong,
          fontSize: '12px',
        }}
      />

      {value ? (
        <Box
          as="button"
          {...({ type: 'button' } as object)}
          onMouseDown={onClear}
          sx={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            color: COLOR.textGhost,
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: '11px' }} />
        </Box>
      ) : null}
    </Box>
  );
};

/** The results dropdown listing matching options. */
const Results = ({
  options,
  onSelect,
}: {
  options: LocatorOption[];
  onSelect: (option: LocatorOption) => void;
}) => {
  return (
    <Box
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '12px',
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        maxHeight: '144px',
        overflowY: 'auto',
      }}
    >
      {options.map((option) => {
        return (
          <Box
            key={option.id}
            as="button"
            {...({ type: 'button' } as object)}
            onMouseDown={() => {
              onSelect(option);
            }}
            sx={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              paddingX: '12px',
              paddingY: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              color: COLOR.textMuted,
              transition: 'background-color 0.15s ease, color 0.15s ease',
              '&:hover': {
                backgroundColor: COLOR.primaryTint,
                color: COLOR.primary,
              },
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
};

/** The card summarizing the currently selected option. */
const SelectedCard = ({ option }: { option: LocatorOption }) => {
  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
        background: COLOR.primaryTint,
        border: `1px solid ${COLOR.primaryTintBorder}`,
      }}
    >
      <Text
        sx={{
          fontFamily: FONT_HEAD,
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLOR.textFaint,
          marginBottom: '2px',
        }}
      >
        Selecionado
      </Text>
      <Text sx={{ fontSize: '13px', fontWeight: 500, color: COLOR.textStrong }}>
        {option.label}
      </Text>
      {option.sublabel ? (
        <Text
          sx={{
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
  );
};

/** The zoom action, enabled only when an option is selected. */
const ZoomButton = ({ selected }: { selected: LocatorOption | null }) => {
  const stateSx = selected
    ? {
        cursor: 'pointer',
        backgroundColor: COLOR.primary,
        color: '#ffffff',
        '&:hover': { backgroundColor: COLOR.primaryDark },
      }
    : {
        cursor: 'default',
        backgroundColor: COLOR.fillAlt,
        color: COLOR.textGhost,
        '&:hover': {},
      };

  return (
    <Box
      as="button"
      {...({ type: 'button', disabled: !selected } as object)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        paddingY: '8px',
        borderRadius: '8px',
        border: 'none',
        fontFamily: FONT_HEAD,
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        transition: 'background-color 0.15s ease',
        ...stateSx,
      }}
    >
      <Icon icon="lucide:zoom-in" style={{ fontSize: '12px' }} />
      {selected ? `Zoom em ${selected.label}` : 'Selecione um município'}
    </Box>
  );
};

/** The locator filter: search box + results + selected card + zoom action. */
export const LocatorControl = ({
  control,
}: {
  control: GeovisWorkspaceSidebarLocatorFilter;
}) => {
  const { options, placeholder, minChars = 2 } = control;

  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<LocatorOption | null>(null);
  const [showDrop, setShowDrop] = React.useState(false);

  const filtered =
    search.length >= minChars
      ? options.filter((option) => {
          return option.label.toLowerCase().includes(search.toLowerCase());
        })
      : [];

  return (
    <Box>
      <SearchInput
        value={search}
        placeholder={placeholder}
        onChange={(next) => {
          setSearch(next);
          setShowDrop(true);
          if (!next) {
            setSelected(null);
          }
        }}
        onFocus={() => {
          setShowDrop(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowDrop(false);
          }, 150);
        }}
        onClear={() => {
          setSearch('');
          setSelected(null);
        }}
      />

      {showDrop && filtered.length > 0 ? (
        <Results
          options={filtered}
          onSelect={(option) => {
            setSelected(option);
            setSearch(option.label);
            setShowDrop(false);
          }}
        />
      ) : null}

      {selected ? <SelectedCard option={selected} /> : null}

      <ZoomButton selected={selected} />
    </Box>
  );
};
