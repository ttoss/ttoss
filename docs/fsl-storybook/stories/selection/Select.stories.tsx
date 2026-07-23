import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectItem } from '@ttoss/fsl-ui';

const meta: Meta<typeof Select> = {
  title: 'Selection/Select',
  component: Select,
  subcomponents: { SelectItem },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => {
    return (
      <Select label="Role" defaultSelectedKey="editor">
        <SelectItem id="admin">Admin</SelectItem>
        <SelectItem id="editor">Editor</SelectItem>
        <SelectItem id="viewer">Viewer</SelectItem>
      </Select>
    );
  },
};

export const Open: Story = {
  render: () => {
    return (
      <Select label="Role" defaultOpen>
        <SelectItem id="admin">Admin</SelectItem>
        <SelectItem id="editor">Editor</SelectItem>
        <SelectItem id="viewer">Viewer</SelectItem>
      </Select>
    );
  },
};
