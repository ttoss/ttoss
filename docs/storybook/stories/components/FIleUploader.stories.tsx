import { Meta, StoryObj } from '@storybook/react-webpack5';
import { FileUploader } from '@ttoss/components/FileUploader';
import { action } from 'storybook/actions';

// Mock upload function for stories
const mockOnUpload = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; id: string }> => {
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
    layout: 'centered',
    docs: {
      description: {
        component:
          'Drag-and-drop file uploader with progress tracking, multiple file support, and customizable upload logic. Provides real-time feedback during upload process.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    uploadFn: { action: 'upload' },
    onUploadComplete: { action: 'upload complete' },
    onUploadError: { action: 'upload error' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with automatic upload
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
          'Basic file uploader with drag-and-drop support. Try dragging files or clicking to select. Shows upload progress and completion status.',
      },
    },
  },
};
