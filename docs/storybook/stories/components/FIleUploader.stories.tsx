import { Meta, StoryObj } from '@storybook/react-webpack5';
import { FileUploader } from '@ttoss/components/FileUploader';
import { action } from 'storybook/actions';

// Mock upload function that simulates successful upload
const mockOnUpload = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; id: string | number }> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      onProgress?.(Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        resolve({
          url: `https://example.com/files/${file.name}`,
          id: Math.random().toString(36).substring(7),
        });
      }
    }, 300);
  });
};

const meta: Meta<typeof FileUploader> = {
  title: 'Components/FileUploader',
  component: FileUploader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Controlled file uploader component with drag-and-drop support. Displays a list of uploaded files with preview, download links, and remove functionality. The component is controlled via the `files` prop, and you manage the upload logic externally.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onUpload: { action: 'upload' },
    onUploadComplete: { action: 'upload complete' },
    onUploadError: { action: 'upload error' },
    onRemove: { action: 'remove file' },
    accept: {
      control: 'text',
      description: 'File types to accept (e.g., "image/*", ".pdf,.doc")',
    },
    maxSize: {
      control: 'number',
      description: 'Maximum file size in bytes',
    },
    maxFiles: {
      control: 'number',
      description: 'Maximum number of files allowed',
    },
    multiple: {
      control: 'boolean',
      description: 'Allow multiple file selection',
    },
    autoUpload: {
      control: 'boolean',
      description: 'Automatically upload files when added',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the file uploader',
    },
    files: {
      control: 'object',
      description: 'Array of uploaded files to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onUpload: mockOnUpload,
    onUploadComplete: action('Upload completed'),
    onUploadError: action('Upload failed'),
    placeholder: 'Drag files here or click to select',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic file uploader with drag-and-drop support. Triggers callbacks for upload lifecycle events.',
      },
    },
  },
};

export const ImageOnly: Story = {
  args: {
    onUpload: mockOnUpload,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 3,
    placeholder: 'Upload your images (max 3 files)',
    onUploadComplete: action('Image uploaded'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Image-only uploader with file type restrictions. Only accepts image files up to 5MB each, with a maximum of 3 files.',
      },
    },
  },
};

export const SingleFile: Story = {
  args: {
    onUpload: mockOnUpload,
    multiple: false,
    accept: '.pdf,.doc,.docx',
    maxSize: 10 * 1024 * 1024, // 10MB
    placeholder: 'Upload a document (PDF or Word)',
    onUploadComplete: action('Document uploaded'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single file uploader restricted to documents. Only allows one PDF or Word document up to 10MB.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    onUpload: mockOnUpload,
    disabled: true,
    placeholder: 'File uploader is disabled',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state of the file uploader with visual feedback.',
      },
    },
  },
};

export const WithUploadedFiles: Story = {
  args: {
    onUpload: mockOnUpload,
    onRemove: action('Remove file'),
    files: [
      {
        id: 'file-1',
        name: 'document.pdf',
        url: 'https://example.com/files/document.pdf',
      },
      {
        id: 'file-2',
        name: 'image.jpg',
        imageUrl: 'https://via.placeholder.com/150',
        url: 'https://example.com/files/image.jpg',
      },
      {
        id: 'file-3',
        name: 'report.xlsx',
        url: 'https://example.com/files/report.xlsx',
      },
    ],
    maxFiles: 10,
    placeholder: 'Add more files',
    onUploadComplete: action('New file uploaded'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Controlled component displaying uploaded files. File names are clickable links that open in a new tab. Each file has a Remove button that triggers the `onRemove` callback. Files with `imageUrl` show a thumbnail preview.',
      },
    },
  },
};

export const WithImageGallery: Story = {
  args: {
    onUpload: mockOnUpload,
    onRemove: action('Remove image'),
    files: [
      {
        id: 1,
        name: 'profile-photo.jpg',
        imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF',
        url: 'https://example.com/images/profile-photo.jpg',
      },
      {
        id: 2,
        name: 'banner.png',
        imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF',
        url: 'https://example.com/images/banner.png',
      },
      {
        id: 3,
        name: 'background.jpg',
        imageUrl: 'https://via.placeholder.com/150/00FF00/FFFFFF',
        url: 'https://example.com/images/background.jpg',
      },
    ],
    accept: 'image/*',
    maxFiles: 5,
    placeholder: 'Upload more images',
    onUploadComplete: action('Image uploaded'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Image gallery with thumbnails. Demonstrates the controlled component pattern with numeric IDs and image previews. Each image is clickable and removable.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    onUpload: mockOnUpload,
    onRemove: action('Remove file'),
    files: [],
    placeholder: 'No files uploaded yet',
    onUploadComplete: action('File uploaded'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with no files. Shows the upload area ready to receive files.',
      },
    },
  },
};
