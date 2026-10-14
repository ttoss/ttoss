import * as React from 'react';

import type { FileUploaderProps, FileUploadState } from './FileUploader';
import { validateFiles } from './FileUploader.utils';

type UseFileUploadsParams = Pick<
  FileUploaderProps,
  | 'onUpload'
  | 'onUploadStart'
  | 'onUploadProgress'
  | 'onUploadComplete'
  | 'onUploadError'
  | 'onFilesChange'
> & {
  maxSize: number;
  maxFiles: number;
  autoUpload: boolean;
  retryAttempts: number;
};

type UpdateFileState = (file: File, updates: Partial<FileUploadState>) => void;

const useUploadFile = ({
  onUpload,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  retryAttempts,
  updateFileState,
}: Pick<
  FileUploaderProps,
  | 'onUpload'
  | 'onUploadStart'
  | 'onUploadProgress'
  | 'onUploadComplete'
  | 'onUploadError'
> & {
  retryAttempts: number;
  updateFileState: UpdateFileState;
}) => {
  return React.useCallback(
    (fileState: FileUploadState): Promise<void> => {
      const attemptUpload = async (attempts: number): Promise<void> => {
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
                return attemptUpload(attempts + 1);
              },
              1000 * (attempts + 1)
            );
          } else {
            updateFileState(fileState.file, { status: 'error', error });
            onUploadError?.(fileState.file, error);
          }
        }
      };

      return attemptUpload(0);
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
};

/**
 * Holds the upload queue state of `FileUploader` and runs the uploads,
 * retrying failed ones up to `retryAttempts` times.
 */
export const useFileUploads = ({
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
}: UseFileUploadsParams) => {
  const [files, setFiles] = React.useState<FileUploadState[]>([]);

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

  const uploadFile = useUploadFile({
    onUpload,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    retryAttempts,
    updateFileState,
  });

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

  const addValidFiles = (newFiles: FileList | File[]) => {
    addFiles(
      validateFiles({
        newFiles,
        currentFileCount: files.length,
        maxFiles,
        maxSize,
      })
    );
  };

  return { files, addValidFiles };
};
