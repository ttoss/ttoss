import { useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Stack, Text } from '@ttoss/ui';

import type { UploadedFile } from './FileUploader';

const UploadedFileItem = ({
  file,
  index,
  onRemove,
}: {
  file: UploadedFile;
  index: number;
  onRemove: (index: number) => void;
}) => {
  const { intl } = useI18n();

  return (
    <Flex
      sx={{
        width: 'full',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        backgroundColor: 'display.background.secondary.default',
        borderRadius: 'md',
        gap: 2,
      }}
    >
      <Flex sx={{ alignItems: 'center', gap: 2, flex: 1 }}>
        {file.imageUrl && (
          <Box sx={{ width: 32, height: 32 }}>
            <img
              src={file.imageUrl}
              alt={file.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Text
              variant="body"
              sx={{
                fontWeight: 'medium',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.default',
                },
              }}
            >
              {file.name}
            </Text>
          </a>
        </Box>
      </Flex>
      <Button
        variant="destructive"
        onClick={() => {
          return onRemove(index);
        }}
        sx={{
          fontSize: 'sm',
          color: 'text.muted',
          '&:hover': { color: 'error.default' },
        }}
      >
        {intl.formatMessage({ defaultMessage: 'Remove' })}
      </Button>
    </Flex>
  );
};

/**
 * Default list of already uploaded files rendered by `FileUploader` when no
 * `FileListComponent` is provided.
 */
export const UploadedFileList = ({
  files,
  onRemove,
}: {
  files: UploadedFile[];
  onRemove: (index: number) => void;
}) => {
  return (
    <Stack sx={{ gap: 1, width: '100%' }}>
      {files.map((file, index) => {
        return (
          <UploadedFileItem
            key={file.id}
            file={file}
            index={index}
            onRemove={onRemove}
          />
        );
      })}
    </Stack>
  );
};
