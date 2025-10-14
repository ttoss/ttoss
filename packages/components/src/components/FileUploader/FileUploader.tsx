import { useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

export type UploadResult = {
  url: string;
  id: string | number;
};

export type FileUploadState = {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  result?: UploadResult;
  error?: Error;
};

export type OnUpload = (
  file: File,
  onProgress?: (progress: number) => void
) => Promise<UploadResult>;

export type OnUploadStart = (file: File) => void;
export type OnUploadProgress = (file: File, progress: number) => void;
export type OnUploadComplete = (file: File, result: UploadResult) => void;
export type OnUploadError = (file: File, error: Error) => void;
export type OnFilesChange = (files: FileUploadState[]) => void;
export type OnRemove = (file: UploadedFile, index: number) => void;

export type UploadedFile = {
  id: string | number;
  name: string;
  imageUrl?: string;
  url: string;
};

export type FileUploaderProps = {
  // Upload function
  onUpload: OnUpload;

  // Callbacks
  onUploadStart?: OnUploadStart;
  onUploadProgress?: OnUploadProgress;
  onUploadComplete?: OnUploadComplete;
  onUploadError?: OnUploadError;
  onFilesChange?: OnFilesChange;
  onRemove?: OnRemove;

  // File constraints
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;

  // Upload settings
  autoUpload?: boolean;
  retryAttempts?: number;

  // UI customization
  placeholder?: string;
  error?: string;
  children?: React.ReactNode;
  showFileList?: boolean;
  FileListComponent?: (props: {
    files: UploadedFile[];
    onRemove: (index: number) => void;
  }) => React.ReactNode;

  // Arquivos já carregados
  files?: UploadedFile[];
};

export const FileUploader = ({
  onUpload,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFilesChange,
  onRemove,
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  autoUpload = true,
  retryAttempts = 2,
  placeholder,
  error,
  children,
  showFileList = true,
  FileListComponent,
  files: uploadedFiles = [],
}: FileUploaderProps) => {
  const { intl } = useI18n();
  const [files, setFiles] = React.useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (newFiles: FileList | File[]): File[] => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const currentFileCount = files.length;

    // Check if maxFiles limit is already reached
    if (currentFileCount >= maxFiles) {
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      if (maxSize && file.size > maxSize) {
        continue;
      }

      // Check max files
      if (validFiles.length + currentFileCount >= maxFiles) {
        break;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const updateFileState = React.useCallback(
    (file: File, updates: Partial<FileUploadState>) => {
      setFiles((prevFiles) => {
        const newFiles = prevFiles.map((f) => {
          return f.file === file ? { ...f, ...updates } : f;
        });
        onFilesChange?.(newFiles);
        return newFiles;
      });
    },
    [onFilesChange]
  );

  const uploadFile = React.useCallback(
    async (fileState: FileUploadState, attempts: number = 0): Promise<void> => {
      try {
        onUploadStart?.(fileState.file);

        updateFileState(fileState.file, { status: 'uploading', progress: 0 });

        const result = await onUpload(fileState.file, (progress) => {
          updateFileState(fileState.file, { progress });
          onUploadProgress?.(fileState.file, progress);
        });

        updateFileState(fileState.file, {
          status: 'completed',
          progress: 100,
          result,
        });

        onUploadComplete?.(fileState.file, result);
      } catch (error_) {
        const error = error_ as Error;

        if (attempts < retryAttempts) {
          setTimeout(
            () => {
              return uploadFile(fileState, attempts + 1);
            },
            1000 * (attempts + 1)
          );
        } else {
          updateFileState(fileState.file, { status: 'error', error });
          onUploadError?.(fileState.file, error);
        }
      }
    },
    [
      onUpload,
      onUploadStart,
      onUploadProgress,
      onUploadComplete,
      onUploadError,
      retryAttempts,
      updateFileState,
    ]
  );

  const addFiles = (newFiles: File[]) => {
    const newFileStates: FileUploadState[] = newFiles.map((file) => {
      return {
        file,
        status: 'pending' as const,
      };
    });

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...newFileStates];
      onFilesChange?.(updatedFiles);
      return updatedFiles;
    });

    if (autoUpload) {
      for (const fileState of newFileStates) {
        uploadFile(fileState);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const validFiles = validateFiles(event.target.files);
      addFiles(validFiles);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled || files.length >= maxFiles) return;

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      const validFiles = validateFiles(droppedFiles);
      addFiles(validFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && files.length < maxFiles) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && files.length < maxFiles && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = React.useCallback(
    (index: number) => {
      const fileToRemove = uploadedFiles[index];
      onRemove?.(fileToRemove, index);
    },
    [uploadedFiles, onRemove]
  );

  const isUploading = files.some((f) => {
    return f.status === 'uploading';
  });

  const isMaxFilesReached = files.length >= maxFiles;

  const fileListNode = React.useMemo(() => {
    if (!showFileList || (files.length === 0 && uploadedFiles.length === 0)) {
      return null;
    }

    if (FileListComponent) {
      return (
        <FileListComponent files={uploadedFiles} onRemove={handleRemoveFile} />
      );
    }

    return (
      <Stack sx={{ gap: 1, width: '100%' }}>
        {uploadedFiles.map((file, index) => {
          return (
            <Flex
              key={file.id}
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
                  return handleRemoveFile(index);
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
        })}
      </Stack>
    );
  }, [
    files.length,
    uploadedFiles,
    handleRemoveFile,
    intl,
    showFileList,
    FileListComponent,
  ]);

  const placeholderTexts = React.useMemo(() => {
    const texts = [];

    if (isUploading) {
      texts.push(intl.formatMessage({ defaultMessage: 'Uploading...' }));
    } else if (isMaxFilesReached) {
      texts.push(
        intl.formatMessage({ defaultMessage: 'Maximum files reached' })
      );
    } else {
      texts.push(
        placeholder ||
          intl.formatMessage({ defaultMessage: 'Click or drag files here' })
      );
    }

    if (!isUploading && !isMaxFilesReached) {
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
    }

    return texts.filter(Boolean).join(' • ');
  }, [
    isUploading,
    isMaxFilesReached,
    intl,
    placeholder,
    accept,
    maxSize,
    multiple,
    maxFiles,
  ]);

  return (
    <Stack
      sx={{
        gap: 3,
        justifyContent: 'stretch',
        width: '100%',
      }}
    >
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        sx={{
          width: '100%',
          border: '2px dashed',
          borderColor: error
            ? 'error.default'
            : isDragOver
              ? 'primary.default'
              : 'display.border.muted.default',
          borderRadius: 'xl',
          padding: 6,
          textAlign: 'center',
          cursor:
            disabled || isUploading || isMaxFilesReached
              ? 'not-allowed'
              : 'pointer',
          backgroundColor: isDragOver
            ? 'primary.muted'
            : 'display.background.secondary.default',
          transition: 'all 0.2s ease',
          opacity: disabled || isMaxFilesReached ? 0.6 : 1,
          '&:hover': {
            borderColor:
              !disabled && !isUploading && !error && !isMaxFilesReached
                ? 'primary.default'
                : undefined,
            backgroundColor:
              !disabled && !isUploading && !isMaxFilesReached
                ? 'primary.muted'
                : undefined,
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading || isMaxFilesReached}
          style={{ display: 'none' }}
        />

        {children || (
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
            {!isUploading && !isMaxFilesReached && (
              <Button variant="secondary" disabled={disabled}>
                {intl.formatMessage({ defaultMessage: 'Select Files' })}
              </Button>
            )}
          </Flex>
        )}
      </Box>

      {error && (
        <Text variant="caption" sx={{ color: 'error.default' }}>
          {error}
        </Text>
      )}

      {fileListNode}
    </Stack>
  );
};
