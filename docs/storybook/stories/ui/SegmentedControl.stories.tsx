import type { Meta, StoryObj } from '@storybook/react';
import { Box, SegmentedControl } from '@ttoss/ui';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Define o tamanho do controle',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente inteiro',
    },
    options: {
      description: 'Lista de opções (strings, números ou objetos)',
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    onChange: (value) => {
      return value;
    },
  },
};

export const WithInitialValue: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    defaultValue: 'Option 2',
    onChange: (value) => {
      return value;
    },
  },
};

export const Disabled: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    disabled: true,
  },
};

export const WithObjectOptions: Story = {
  args: {
    options: [
      { label: 'First Option', value: 'option1' },
      { label: 'Second Option', value: 'option2' },
      { label: 'Disabled Option', value: 'option3', disabled: true },
    ],
    onChange: (value) => {
      return value;
    },
  },
};

export const SmallSize: Story = {
  args: {
    options: ['Daily', 'Weekly', 'Monthly'],
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    options: ['Daily', 'Weekly', 'Monthly'],
    size: 'lg',
  },
};

export const NumericValues: Story = {
  args: {
    options: [10, 20, 30, 40],
    defaultValue: 20,
  },
};

export const CustomWidth: Story = {
  args: {
    options: ['Left', 'Center', 'Right'],
    defaultValue: 'Center',
  },
  render: (args) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SegmentedControl {...args} />
      </Box>
    );
  },
};

export const AllSizes: Story = {
  args: {
    options: ['Sem limite', 'Limite diário', 'Limite mensal'],
  },
  render: (args) => {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}
      >
        <Box sx={{ display: 'block', width: '100%' }}>
          <h4>Small (sm)</h4>
          <Box sx={{ width: 'fit-content' }}>
            <SegmentedControl {...args} size="sm" />
          </Box>
        </Box>

        <Box sx={{ display: 'block', width: '100%' }}>
          <h4>Medium (md) - Default</h4>
          <Box sx={{ width: 'fit-content' }}>
            <SegmentedControl {...args} size="md" />
          </Box>
        </Box>

        <Box sx={{ display: 'block', width: '100%' }}>
          <h4>Large (lg)</h4>
          <Box sx={{ width: 'fit-content' }}>
            <SegmentedControl {...args} size="lg" />
          </Box>
        </Box>
      </Box>
    );
  },
};
