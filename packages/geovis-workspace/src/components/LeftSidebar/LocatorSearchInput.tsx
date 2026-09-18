import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box } from '@ttoss/ui';
import type * as React from 'react';

import { messages } from '../../messages';
import { COLOR } from './theme';

export const LocatorSearchInput = ({
  value,
  placeholder,
  focused,
  listboxId,
  activeOptionId,
  expanded,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onClear,
}: {
  value: string;
  placeholder?: string;
  focused: boolean;
  listboxId: string;
  activeOptionId?: string;
  expanded: boolean;
  onChange: (next: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Box sx={{ position: 'relative', marginBottom: '8px' }}>
      <Box
        sx={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          transition: 'color 0.15s ease',
          color: focused ? COLOR.primary : COLOR.textGhost,
        }}
      >
        <Icon icon="lucide:search" style={{ fontSize: '12px' }} />
      </Box>

      <input
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          borderRadius: '6px',
          padding: '8px 32px',
          outline: 'none',
          background: focused ? COLOR.surface : COLOR.fill,
          border: `1px solid ${focused ? COLOR.primarySoft : COLOR.border}`,
          color: COLOR.textStrong,
          fontSize: '12px',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
        }}
      />

      {value ? (
        <Box
          as="button"
          {...({ type: 'button' } as object)}
          aria-label={formatMessage(messages.locatorClearSearch)}
          onMouseDown={onClear}
          sx={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            padding: 0,
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: COLOR.textGhost,
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': {
              color: COLOR.textMuted,
              backgroundColor: COLOR.fill,
            },
          }}
        >
          <Icon icon="lucide:x" style={{ fontSize: '11px' }} />
        </Box>
      ) : null}
    </Box>
  );
};
