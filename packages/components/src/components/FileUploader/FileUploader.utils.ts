import type { ThemeUIStyleObject } from '@ttoss/ui';

import type { FileUploaderProps } from './FileUploader';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFiles = ({
  newFiles,
  currentFileCount,
  maxFiles,
  maxSize,
}: {
  newFiles: FileList | File[];
  currentFileCount: number;
  maxFiles: number;
  maxSize: number;
}): File[] => {
  const fileArray = Array.from(newFiles);
  const validFiles: File[] = [];

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

export const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Applies the default values of the optional `FileUploader` props, keeping
 * the semantics of destructuring defaults (only `undefined` is replaced).
 */
export const resolveFileUploaderProps = ({
  multiple = true,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 5,
  disabled = false,
  autoUpload = true,
  retryAttempts = 2,
  showFileList = true,
  files = [],
  ...rest
}: FileUploaderProps) => {
  return {
    ...rest,
    multiple,
    maxSize,
    maxFiles,
    disabled,
    autoUpload,
    retryAttempts,
    showFileList,
    files,
  };
};

const getDropzoneBorderColor = ({
  error,
  isDragOver,
}: {
  error?: string;
  isDragOver: boolean;
}) => {
  if (error) {
    return 'error.default';
  }

  return isDragOver ? 'primary.default' : 'display.border.muted.default';
};

export const getDropzoneSx = ({
  error,
  isDragOver,
  disabled,
  isUploading,
  isMaxFilesReached,
}: {
  error?: string;
  isDragOver: boolean;
  disabled: boolean;
  isUploading: boolean;
  isMaxFilesReached: boolean;
}): ThemeUIStyleObject => {
  const isBlocked = disabled || isUploading || isMaxFilesReached;

  return {
    width: '100%',
    border: '2px dashed',
    borderColor: getDropzoneBorderColor({ error, isDragOver }),
    borderRadius: 'xl',
    padding: 6,
    textAlign: 'center',
    cursor: isBlocked ? 'not-allowed' : 'pointer',
    backgroundColor: isDragOver
      ? 'primary.muted'
      : 'display.background.secondary.default',
    transition: 'all 0.2s ease',
    opacity: disabled || isMaxFilesReached ? 0.6 : 1,
    '&:hover': {
      borderColor: !isBlocked && !error ? 'primary.default' : undefined,
      backgroundColor: !isBlocked ? 'primary.muted' : undefined,
    },
  };
};
