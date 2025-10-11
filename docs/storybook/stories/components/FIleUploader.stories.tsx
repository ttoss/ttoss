import { Meta, StoryObj } from '@storybook/react-webpack5';
import { FileUploader } from '@ttoss/components/FileUploader';
import { action } from 'storybook/actions';

// Mock upload function for stories
const mockUploadFn = (
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
    uploadFn: mockUploadFn,
    onUploadComplete: action('Upload completed'),
    onUploadError: action('Upload failed'),
    placeholder: 'Drag files here or click to select',
  },
};
