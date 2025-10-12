import { render, screen, userEvent, waitFor } from '@ttoss/test-utils';
import {
  FileUploader,
  type FileUploaderProps,
  type UploadResult,
} from 'src/components/FileUploader/FileUploader';

// Mock File constructor for testing
const createMockFile = (
  name: string,
  size: number,
  type: string = 'text/plain'
): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUploader', () => {
  const mockUploadResult: UploadResult = {
    url: 'https://example.com/file.txt',
    id: 'file-123',
  };

  const mockOnUpload = jest.fn();
  const mockOnUploadStart = jest.fn();
  const mockOnUploadProgress = jest.fn();
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();
  const mockOnFilesChange = jest.fn();

  const defaultProps: FileUploaderProps = {
    onUpload: mockOnUpload,
    onUploadStart: mockOnUploadStart,
    onUploadProgress: mockOnUploadProgress,
    onUploadComplete: mockOnUploadComplete,
    onUploadError: mockOnUploadError,
    onFilesChange: mockOnFilesChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpload.mockImplementation(
      (file: File, onProgress?: (progress: number) => void) => {
        return new Promise((resolve) => {
          // Simulate upload progress
          if (onProgress) {
            setTimeout(() => {
              return onProgress(50);
            }, 10);
            setTimeout(() => {
              return onProgress(100);
            }, 20);
          }
          setTimeout(() => {
            return resolve(mockUploadResult);
          }, 30);
        });
      }
    );
  });

  test('should handle complete file upload flow successfully', async () => {
    const user = userEvent.setup();

    const { container } = render(<FileUploader {...defaultProps} />);

    // Find the hidden file input
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Create mock file
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    // Simulate file selection
    await user.upload(fileInput, mockFile);

    // Verify upload start callback
    await waitFor(() => {
      expect(mockOnUploadStart).toHaveBeenCalledWith(mockFile);
    });

    // Verify files change callback with pending status
    expect(mockOnFilesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        file: mockFile,
        status: 'pending',
      }),
    ]);

    // Verify upload function is called
    expect(mockOnUpload).toHaveBeenCalledWith(mockFile, expect.any(Function));

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(
        mockFile,
        mockUploadResult
      );
    });

    // Verify final state shows completed file
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument(); // Completed status icon
    expect(screen.getByText('1 KB')).toBeInTheDocument(); // File size

    // Verify files change callback with completed status
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          file: mockFile,
          status: 'completed',
          result: mockUploadResult,
          progress: 100,
        }),
      ]);
    });
  });

  test('should handle upload errors and retry functionality', async () => {
    const user = userEvent.setup();
    const uploadError = new Error('Upload failed');

    // Mock upload function to fail immediately
    mockOnUpload.mockImplementation(() => {
      return Promise.reject(uploadError);
    });

    const { container } = render(
      <FileUploader {...defaultProps} retryAttempts={1} />
    );

    // Find the hidden file input
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    // Simulate file selection
    await user.upload(fileInput, mockFile);

    // Wait for upload to start
    await waitFor(() => {
      expect(mockOnUploadStart).toHaveBeenCalledWith(mockFile);
    });

    // Wait for error state - need to wait longer for retries to complete
    await waitFor(
      () => {
        expect(mockOnUploadError).toHaveBeenCalledWith(mockFile, uploadError);
      },
      { timeout: 5000 }
    );

    // Verify error UI is shown
    expect(screen.getByText('✗')).toBeInTheDocument(); // Error status icon
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // Clear previous mock calls before retry
    jest.clearAllMocks();

    // Test retry functionality - reset mock to succeed
    mockOnUpload.mockImplementation(
      (file: File, onProgress?: (progress: number) => void) => {
        return new Promise((resolve) => {
          if (onProgress) {
            setTimeout(() => {
              return onProgress(100);
            }, 10);
          }
          setTimeout(() => {
            return resolve(mockUploadResult);
          }, 20);
        });
      }
    );

    await user.click(screen.getByRole('button', { name: /retry/i }));

    // Wait for retry upload to start
    await waitFor(() => {
      expect(mockOnUploadStart).toHaveBeenCalledWith(mockFile);
    });

    // Wait for retry upload to complete
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(
        mockFile,
        mockUploadResult
      );
    });

    // Verify success state after retry
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument(); // Completed status icon
    });
  });

  test('should handle file removal', async () => {
    const user = userEvent.setup();
    const mockOnRemoveFile = jest.fn();

    const { container } = render(
      <FileUploader
        {...defaultProps}
        onRemoveFile={mockOnRemoveFile}
        autoUpload={false}
      />
    );

    // Find the hidden file input
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    // Simulate file selection
    await user.upload(fileInput, mockFile);

    // Wait for file to appear
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    // Verify file is in pending state
    expect(screen.getByText('📄')).toBeInTheDocument(); // Pending status icon

    // Remove the file
    await user.click(screen.getByRole('button', { name: /remove/i }));

    // Verify removal callbacks
    expect(mockOnRemoveFile).toHaveBeenCalledWith(
      expect.objectContaining({ file: mockFile }),
      0
    );

    // Verify file is removed from UI
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();

    // Verify onFilesChange is called with empty array
    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenLastCalledWith([]);
    });
  });
});
