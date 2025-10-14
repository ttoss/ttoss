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
  const mockOnRemove = jest.fn();

  const defaultProps: FileUploaderProps = {
    onUpload: mockOnUpload,
    onUploadStart: mockOnUploadStart,
    onUploadProgress: mockOnUploadProgress,
    onUploadComplete: mockOnUploadComplete,
    onUploadError: mockOnUploadError,
    onFilesChange: mockOnFilesChange,
    onRemove: mockOnRemove,
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

  test('should handle dragOver and dragLeave events', async () => {
    const { container } = render(<FileUploader {...defaultProps} />);
    const dropArea = container.querySelector('div[role="presentation"], div');
    expect(dropArea).toBeInTheDocument();
    if (dropArea) {
      await waitFor(() => {
        dropArea.dispatchEvent(new Event('dragover', { bubbles: true }));
      });
      await waitFor(() => {
        dropArea.dispatchEvent(new Event('dragleave', { bubbles: true }));
      });
    }
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
  });

  test('should handle file removal', async () => {
    const user = userEvent.setup();
    const mockOnRemoveLocal = jest.fn();
    const preloadedFiles = [
      {
        id: 'file-1',
        name: 'test.txt',
        url: 'https://example.com/files/test.txt',
      },
    ];

    render(
      <FileUploader
        {...defaultProps}
        files={preloadedFiles}
        onRemove={mockOnRemoveLocal}
      />
    );

    // Wait for file to appear
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    // Remove the file
    await user.click(screen.getByRole('button', { name: /remove/i }));

    // Verify removal callbacks
    expect(mockOnRemoveLocal).toHaveBeenCalledWith(preloadedFiles[0], 0);
  });

  test('should render custom FileListComponent', async () => {
    const files = [
      {
        id: 1,
        name: 'custom.txt',
        url: 'https://example.com/files/custom.txt',
      },
    ];

    const mockFileListComponent = jest.fn(({ files: fileList }) => {
      return (
        <div data-testid="custom-list">
          <span data-testid="file-count">{fileList.length}</span>
        </div>
      );
    });

    render(
      <FileUploader
        {...defaultProps}
        files={files}
        FileListComponent={mockFileListComponent}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
      const callArgs = mockFileListComponent.mock.calls[0][0];
      expect(callArgs).toEqual(
        expect.objectContaining({
          files,
          onRemove: expect.any(Function),
        })
      );
    });
  });

  test('should display preloaded files', async () => {
    const preloadedFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        url: 'https://example.com/files/document.pdf',
      },
      {
        id: 'file-2',
        name: 'image.jpg',
        imageUrl: 'https://example.com/images/image.jpg',
        url: 'https://example.com/files/image.jpg',
      },
    ];

    render(<FileUploader {...defaultProps} files={preloadedFiles} />);

    // Verify preloaded files are displayed
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();

    // Verify download links are present (file names are links now)
    const downloadLinks = screen.getAllByRole('link');
    expect(downloadLinks).toHaveLength(2);
    expect(downloadLinks[0]).toHaveAttribute(
      'href',
      'https://example.com/files/document.pdf'
    );
    expect(downloadLinks[1]).toHaveAttribute(
      'href',
      'https://example.com/files/image.jpg'
    );

    // Verify remove buttons are present
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  test('should display preloaded files with image previews', async () => {
    const preloadedFiles = [
      {
        id: 1,
        name: 'photo.jpg',
        imageUrl: 'https://example.com/images/photo.jpg',
        url: 'https://example.com/files/photo.jpg',
      },
    ];

    const { container } = render(
      <FileUploader {...defaultProps} files={preloadedFiles} />
    );

    // Verify file name is displayed
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();

    // Verify image preview is rendered
    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      'src',
      'https://example.com/images/photo.jpg'
    );
    expect(image).toHaveAttribute('alt', 'photo.jpg');
  });

  test('should call onRemove when remove button is clicked on preloaded file', async () => {
    const user = userEvent.setup();
    const mockOnRemoveLocal = jest.fn();
    const preloadedFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        url: 'https://example.com/files/document.pdf',
      },
    ];

    render(
      <FileUploader
        {...defaultProps}
        files={preloadedFiles}
        onRemove={mockOnRemoveLocal}
      />
    );

    // Click remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    // Verify onRemove was called with correct arguments
    expect(mockOnRemoveLocal).toHaveBeenCalledWith(preloadedFiles[0], 0);
  });

  test('should display both preloaded files and new uploads', async () => {
    const user = userEvent.setup();
    const preloadedFiles = [
      {
        id: 'existing-1',
        name: 'existing.pdf',
        url: 'https://example.com/files/existing.pdf',
      },
    ];

    const { container } = render(
      <FileUploader
        {...defaultProps}
        files={preloadedFiles}
        autoUpload={false}
      />
    );

    // Verify preloaded file is displayed
    expect(screen.getByText('existing.pdf')).toBeInTheDocument();

    // Add a new file
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const mockFile = createMockFile('new.txt', 1024, 'text/plain');
    await user.upload(fileInput, mockFile);

    // Verify preloaded file is still displayed
    await waitFor(() => {
      expect(screen.getByText('existing.pdf')).toBeInTheDocument();
    });

    // Verify upload was triggered
    expect(mockOnFilesChange).toHaveBeenCalled();
  });

  test('should pass preloaded files to custom FileListComponent', async () => {
    const preloadedFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        url: 'https://example.com/files/document.pdf',
      },
    ];

    const mockFileListComponent = jest.fn(({ files }) => {
      return (
        <div data-testid="custom-list">
          <span data-testid="files-count">{files.length}</span>
        </div>
      );
    });

    render(
      <FileUploader
        {...defaultProps}
        files={preloadedFiles}
        FileListComponent={mockFileListComponent}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
      const callArgs = mockFileListComponent.mock.calls[0][0];
      expect(callArgs).toEqual(
        expect.objectContaining({
          files: preloadedFiles,
          onRemove: expect.any(Function),
        })
      );
    });
  });

  test('should not display file list when showFileList is false', () => {
    const preloadedFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        url: 'https://example.com/files/document.pdf',
      },
    ];

    render(
      <FileUploader
        {...defaultProps}
        files={preloadedFiles}
        showFileList={false}
      />
    );

    // Verify files are not displayed
    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
  });
});
