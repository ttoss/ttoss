import { Box, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

import { DropzoneContent } from './DropzoneContent';
import { getDropzoneSx, resolveFileUploaderProps } from './FileUploader.utils';
import { UploadedFileList } from './UploadedFileList';
import { useFileUploads } from './useFileUploads';

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

const FileListSection = ({
  showFileList,
  pendingFilesCount,
  uploadedFiles,
  onRemove,
  FileListComponent,
}: {
  showFileList: boolean;
  pendingFilesCount: number;
  uploadedFiles: UploadedFile[];
  onRemove: FileUploaderProps['onRemove'];
  FileListComponent: FileUploaderProps['FileListComponent'];
}) => {
  const handleRemoveFile = React.useCallback(
    (index: number) => {
      const fileToRemove = uploadedFiles[index];
      onRemove?.(fileToRemove, index);
    },
    [uploadedFiles, onRemove]
  );

  if (
    !showFileList ||
    (pendingFilesCount === 0 && uploadedFiles.length === 0)
  ) {
    return null;
  }

  if (FileListComponent) {
    return (
      <FileListComponent files={uploadedFiles} onRemove={handleRemoveFile} />
    );
  }

  return <UploadedFileList files={uploadedFiles} onRemove={handleRemoveFile} />;
};

/**
 * Drag-and-drop file input that uploads files through `onUpload`, with
 * progress callbacks, retries, size/count limits, and a list of uploaded files.
 */
export const FileUploader = (props: FileUploaderProps) => {
  const {
    onUpload,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    onFilesChange,
    onRemove,
    accept,
    multiple,
    maxSize,
    maxFiles,
    disabled,
    autoUpload,
    retryAttempts,
    placeholder,
    error,
    children,
    showFileList,
    FileListComponent,
    files: uploadedFiles,
  } = resolveFileUploaderProps(props);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { files, addValidFiles } = useFileUploads({
    onUpload,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    onFilesChange,
    maxSize,
    maxFiles,
    autoUpload,
    retryAttempts,
  });

  const isUploading = files.some((f) => {
    return f.status === 'uploading';
  });

  const isMaxFilesReached = files.length >= maxFiles;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addValidFiles(event.target.files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled || isMaxFilesReached) return;

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      addValidFiles(droppedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !isMaxFilesReached) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && !isMaxFilesReached && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
        sx={getDropzoneSx({
          error,
          isDragOver,
          disabled,
          isUploading,
          isMaxFilesReached,
        })}
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
          <DropzoneContent
            isUploading={isUploading}
            isMaxFilesReached={isMaxFilesReached}
            disabled={disabled}
            placeholder={placeholder}
            accept={accept}
            maxSize={maxSize}
            multiple={multiple}
            maxFiles={maxFiles}
          />
        )}
      </Box>

      {error && (
        <Text variant="caption" sx={{ color: 'error.default' }}>
          {error}
        </Text>
      )}

      <FileListSection
        showFileList={showFileList}
        pendingFilesCount={files.length}
        uploadedFiles={uploadedFiles}
        onRemove={onRemove}
        FileListComponent={FileListComponent}
      />
    </Stack>
  );
};
