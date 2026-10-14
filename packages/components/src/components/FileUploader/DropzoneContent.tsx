import { useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import { formatFileSize } from './FileUploader.utils';

type IntlShape = ReturnType<typeof useI18n>['intl'];

const getStatusText = ({
  intl,
  isUploading,
  isMaxFilesReached,
  placeholder,
}: {
  intl: IntlShape;
  isUploading: boolean;
  isMaxFilesReached: boolean;
  placeholder?: string;
}) => {
  if (isUploading) {
    return intl.formatMessage({ defaultMessage: 'Uploading...' });
  }

  if (isMaxFilesReached) {
    return intl.formatMessage({ defaultMessage: 'Maximum files reached' });
  }

  return (
    placeholder ||
    intl.formatMessage({ defaultMessage: 'Click or drag files here' })
  );
};

const getConstraintTexts = ({
  intl,
  accept,
  maxSize,
  multiple,
  maxFiles,
}: {
  intl: IntlShape;
  accept?: string;
  maxSize: number;
  multiple: boolean;
  maxFiles: number;
}) => {
  const texts: string[] = [];

  if (accept) texts.push(accept);
  if (maxSize) texts.push(`Max ${formatFileSize(maxSize)}`);
  if (multiple && maxFiles)
    texts.push(
      intl.formatMessage(
        {
          defaultMessage:
            '{max_files, plural, one {Up to # file} other {Up to # files}}',
        },
        { max_files: maxFiles }
      )
    );

  return texts;
};

/**
 * Default content of the `FileUploader` drop zone: title, placeholder and
 * constraint hints, and the select button.
 */
export const DropzoneContent = ({
  isUploading,
  isMaxFilesReached,
  disabled,
  placeholder,
  accept,
  maxSize,
  multiple,
  maxFiles,
}: {
  isUploading: boolean;
  isMaxFilesReached: boolean;
  disabled: boolean;
  placeholder?: string;
  accept?: string;
  maxSize: number;
  multiple: boolean;
  maxFiles: number;
}) => {
  const { intl } = useI18n();
  const isIdle = !isUploading && !isMaxFilesReached;

  const placeholderTexts = React.useMemo(() => {
    const texts = [
      getStatusText({ intl, isUploading, isMaxFilesReached, placeholder }),
    ];

    if (isIdle) {
      texts.push(
        ...getConstraintTexts({ intl, accept, maxSize, multiple, maxFiles })
      );
    }

    return texts.filter(Boolean).join(' • ');
  }, [
    isUploading,
    isMaxFilesReached,
    isIdle,
    intl,
    placeholder,
    accept,
    maxSize,
    multiple,
    maxFiles,
  ]);

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center',
      }}
    >
      <Text sx={{ fontSize: '2xl' }}>
        {intl.formatMessage({ defaultMessage: 'File Upload' })}
      </Text>
      <Box sx={{ textAlign: 'center' }}>
        <Text variant="body" sx={{ color: 'text.default', mb: 1 }}>
          {placeholderTexts}
        </Text>
      </Box>
      {isIdle && (
        <Button variant="secondary" disabled={disabled}>
          {intl.formatMessage({ defaultMessage: 'Select Files' })}
        </Button>
      )}
    </Flex>
  );
};
