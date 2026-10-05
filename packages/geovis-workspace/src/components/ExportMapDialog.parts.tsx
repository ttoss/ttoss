import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import { sanitizeFileName } from '../export/exportFileName';
import { useNumberFormat } from '../hooks/useNumberFormat';
import { messages } from '../messages';
import { Spinner } from './LeftSidebar/Spinner';
import { COLOR, FONT_HEAD, FONT_MONO } from './LeftSidebar/theme';
import { Switch } from './LeftSidebar/ToggleSettingControl';

/** The extension the download always gets, shown after the name field. */
export const PNG_EXTENSION = '.png';

/** The dialog's heading row: the image chip, the title, and the ✕. */
export const DialogHeader = ({ onClose }: { onClose: () => void }) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        paddingX: '20px',
        paddingY: '16px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      <Flex sx={{ alignItems: 'center', gap: '10px' }}>
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            color: COLOR.primary,
            backgroundColor: COLOR.primaryTint,
          }}
        >
          <Icon icon="lucide:image-down" style={{ fontSize: '14px' }} />
        </Flex>

        <Text
          sx={{
            fontFamily: FONT_HEAD,
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: COLOR.textStrong,
          }}
        >
          {formatMessage(messages.exportTitle)}
        </Text>
      </Flex>

      <IconButton
        icon="lucide:x"
        aria-label={formatMessage(messages.exportClose)}
        onClick={onClose}
        sx={{
          width: '28px',
          height: '28px',
          minWidth: 'auto',
          color: COLOR.textGhost,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          borderRadius: 'md',
          '&:hover': { color: COLOR.textMuted, backgroundColor: COLOR.fill },
        }}
      />
    </Flex>
  );
};

/** Uppercase field label, as the sidebar's block headers draw theirs. */
const FieldLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text
      sx={{
        display: 'block',
        marginBottom: '8px',
        fontFamily: FONT_HEAD,
        fontWeight: 600,
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: COLOR.textFaint,
      }}
    >
      {children}
    </Text>
  );
};

/**
 * The file-name field. What the reader types is cleaned as they type, so the
 * field never holds a name the download would have to reject.
 */
export const FileNameField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Box as="label" sx={{ display: 'block' }}>
      <FieldLabel>{formatMessage(messages.exportFileName)}</FieldLabel>

      <Flex
        sx={{
          alignItems: 'center',
          height: '34px',
          paddingX: '10px',
          borderRadius: '6px',
          backgroundColor: COLOR.fill,
          border: `1px solid ${COLOR.border}`,
          fontFamily: FONT_MONO,
          fontSize: '12px',
        }}
      >
        <input
          type="text"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            onChange(sanitizeFileName(event.target.value));
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 'none',
            background: 'transparent',
            font: 'inherit',
            color: COLOR.textStrong,
          }}
        />
        <Text sx={{ flexShrink: 0, color: COLOR.textGhost }}>
          {PNG_EXTENSION}
        </Text>
      </Flex>
    </Box>
  );
};

/** One include/exclude option: the whole row is the button, as in the settings tab. */
export const OptionToggle = ({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) => {
  return (
    <Box
      as="button"
      {...({ type: 'button', role: 'switch', 'aria-checked': on } as object)}
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '9px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        backgroundColor: on ? COLOR.primaryTint : COLOR.fillAlt,
        border: `1px solid ${on ? COLOR.primaryTintBorder : 'transparent'}`,
      }}
    >
      <Text
        sx={{ flex: 1, minWidth: 0, fontSize: '12px', color: COLOR.textStrong }}
      >
        {label}
      </Text>

      <Switch on={on} />
    </Box>
  );
};

/**
 * The preview frame and, under it, its caption and the output size. While
 * `loading`, the frame holds a spinner where the image will land.
 */
export const Preview = ({
  src,
  loading,
  width,
  height,
}: {
  src?: string;
  loading: boolean;
  width?: number;
  height?: number;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();
  const formatNumber = useNumberFormat();

  return (
    <Box>
      <Box
        sx={{
          // Holds the map's aspect while the frame is being captured, so the
          // dialog does not jump when the image lands.
          aspectRatio: width && height ? `${width} / ${height}` : '16 / 10',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: COLOR.fill,
          boxShadow: `0 0 0 1px ${COLOR.border}`,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={formatMessage(messages.exportPreviewAlt)}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        ) : loading ? (
          <Flex
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Spinner
              size="20px"
              label={formatMessage(messages.exportPreviewLoading)}
            />
          </Flex>
        ) : null}
      </Box>

      <Flex
        sx={{
          justifyContent: 'space-between',
          gap: '8px',
          marginTop: '6px',
          fontFamily: FONT_MONO,
          fontSize: '10px',
          color: COLOR.textFaint,
        }}
      >
        <Text>{formatMessage(messages.exportPreviewCaption)}</Text>
        {width && height ? (
          <Text sx={{ color: COLOR.textStrong }}>
            {formatMessage(messages.exportDimensions, {
              width: formatNumber(width),
              height: formatNumber(height),
            })}
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
};

/** The footer: cancel, and the download that turns into "Gerando…". */
export const Footer = ({
  busy,
  disabled,
  onCancel,
  onDownload,
}: {
  busy: boolean;
  disabled: boolean;
  onCancel: () => void;
  onDownload?: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const buttonBase = {
    height: '36px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: FONT_HEAD,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as const;

  return (
    <Flex
      sx={{
        flexShrink: 0,
        gap: '8px',
        paddingX: '20px',
        paddingY: '12px',
        backgroundColor: COLOR.fillAlt,
        borderTop: `1px solid ${COLOR.border}`,
      }}
    >
      <Box
        as="button"
        {...({ type: 'button' } as object)}
        onClick={onCancel}
        sx={{
          ...buttonBase,
          flex: 1,
          backgroundColor: 'transparent',
          border: `1px solid ${COLOR.border}`,
          color: COLOR.textMuted,
        }}
      >
        {formatMessage(messages.exportCancel)}
      </Box>

      <Box
        as="button"
        {...({ type: 'button', disabled } as object)}
        onClick={onDownload}
        sx={{
          ...buttonBase,
          flex: 1.4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          border: 0,
          backgroundColor: COLOR.primary,
          color: '#ffffff',
          opacity: disabled ? 0.6 : 1,
          '&:disabled': { cursor: 'default' },
          '&:hover:not(:disabled)': { backgroundColor: COLOR.primaryDark },
        }}
      >
        <Icon icon="lucide:download" style={{ fontSize: '14px' }} />
        {formatMessage(
          busy ? messages.exportGenerating : messages.exportDownload
        )}
      </Box>
    </Flex>
  );
};
