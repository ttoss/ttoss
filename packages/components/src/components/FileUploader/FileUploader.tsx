import { FormattedMessage } from '@ttoss/react-i18n';
import { Box, Button, Flex, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

export type UploadResult = {
  url: string;
  id: string;
};

export type FileUploadState = {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  result?: UploadResult;
  error?: Error;
};

export type FileUploaderProps = {
  // Upload function
  uploadFn: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<UploadResult>;

  // Callbacks
  onUploadStart?: (file: File) => void;
  onUploadProgress?: (file: File, progress: number) => void;
  onUploadComplete?: (file: File, result: UploadResult) => void;
  onUploadError?: (file: File, error: Error) => void;
  onFilesChange?: (files: FileUploadState[]) => void;
  onRemoveFile?: (file: FileUploadState, index: number) => void;

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
    files: FileUploadState[];
    onRemoveFile: (index: number) => void;
  }) => React.ReactNode;
};

export const FileUploader = ({
  uploadFn,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFilesChange,
  onRemoveFile,
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
}: FileUploaderProps) => {
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

        const result = await uploadFn(fileState.file, (progress) => {
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
      uploadFn,
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

    if (disabled) return;

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      const validFiles = validateFiles(droppedFiles);
      addFiles(validFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = React.useCallback(
    (index: number) => {
      const fileToRemove = files[index];
      setFiles((prevFiles) => {
        const newFiles = prevFiles.filter((_, i) => {
          return i !== index;
        });
        onFilesChange?.(newFiles);
        return newFiles;
      });
      onRemoveFile?.(fileToRemove, index);
    },
    [files, onFilesChange, onRemoveFile]
  );

  const retryUpload = React.useCallback(
    (index: number) => {
      const fileState = files[index];
      if (fileState.status === 'error') {
        uploadFile(fileState);
      }
    },
    [files, uploadFile]
  );

  const isUploading = files.some((f) => {
    return f.status === 'uploading';
  });

  const fileListNode = React.useMemo(() => {
    if (!showFileList || files.length === 0) {
      return null;
    }

    if (FileListComponent) {
      return (
        <FileListComponent files={files} onRemoveFile={handleRemoveFile} />
      );
    }

    return (
      <Stack sx={{ gap: 1 }}>
        {files.map((fileState, index) => {
          return (
            <Flex
              key={index}
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                backgroundColor: 'display.background.secondary.default',
                borderRadius: 'md',
                gap: 2,
              }}
            >
              <Flex sx={{ alignItems: 'center', gap: 2, flex: 1 }}>
                <Text sx={{ fontSize: 'lg' }}>
                  {fileState.status === 'completed'
                    ? '✓'
                    : fileState.status === 'error'
                      ? '✗'
                      : fileState.status === 'uploading'
                        ? '↻'
                        : '📄'}
                </Text>
                <Box sx={{ flex: 1 }}>
                  <Text variant="body" sx={{ fontWeight: 'medium' }}>
                    {fileState.file.name}
                  </Text>
                  {fileState.status === 'uploading' && fileState.progress && (
                    <Text variant="caption" sx={{ color: 'primary.default' }}>
                      {fileState.progress.toFixed(0)}%
                    </Text>
                  )}
                  {fileState.status === 'error' && (
                    <Text variant="caption" sx={{ color: 'error.default' }}>
                      Failed
                    </Text>
                  )}
                </Box>
                <Text variant="caption" sx={{ color: 'text.muted' }}>
                  {formatFileSize(fileState.file.size)}
                </Text>
              </Flex>

              <Flex sx={{ gap: 1 }}>
                {fileState.status === 'error' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      return retryUpload(index);
                    }}
                    sx={{ fontSize: 'xs' }}
                  >
                    Retry
                  </Button>
                )}
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
                  Remove
                </Button>
              </Flex>
            </Flex>
          );
        })}
      </Stack>
    );
  }, [FileListComponent, files, handleRemoveFile, retryUpload, showFileList]);

  return (
    <Stack
      sx={{
        gap: 3,
      }}
    >
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        sx={{
          border: '2px dashed',
          borderColor: error
            ? 'error.default'
            : isDragOver
              ? 'primary.default'
              : 'display.border.muted.default',
          borderRadius: 'xl',
          padding: 6,
          textAlign: 'center',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragOver
            ? 'primary.muted'
            : 'display.background.secondary.default',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            borderColor:
              !disabled && !isUploading && !error
                ? 'primary.default'
                : undefined,
            backgroundColor:
              !disabled && !isUploading ? 'primary.muted' : undefined,
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
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
            <Text sx={{ fontSize: '3xl' }}>📁</Text>
            <Box sx={{ textAlign: 'center' }}>
              <Text variant="body" sx={{ color: 'text.default', mb: 1 }}>
                {isUploading ? (
                  <FormattedMessage defaultMessage="Uploading..." />
                ) : (
                  placeholder || (
                    <FormattedMessage defaultMessage="Click or drag files here" />
                  )
                )}
              </Text>
              <Text variant="caption" sx={{ color: 'text.muted' }}>
                {[
                  accept && accept,
                  maxSize && `Max ${formatFileSize(maxSize)}`,
                  multiple && maxFiles && `Up to ${maxFiles} files`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </Box>
            {!isUploading && (
              <Button variant="secondary" disabled={disabled}>
                <FormattedMessage defaultMessage="Select Files" />
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
