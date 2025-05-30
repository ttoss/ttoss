import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from '@ttoss/ui';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente inteiro',
    },
    options: {
      description: 'Lista de opções (strings, números ou objetos)',
    },
    showDividers: {
      control: 'boolean',
      description: 'Mostra divisores verticais entre as opções',
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

export const Disabled: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    disabled: true,
  },
};

export const WithDividers: Story = {
  args: {
    options: ['Opção 1', 'Opção 2', 'Opção 3'],
    showDividers: true,
  },
};
