import type { Meta, StoryObj } from '@storybook/react-webpack5';
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
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'accent'],
      description: 'Variante visual que mapeia para tokens de tema',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do componente',
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'option1',
    variant: 'accent',
    onChange: (value) => {
      return value;
    },
  },
};

export const Disabled: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    disabled: true,
  },
};

export const DisabledOption: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3', disabled: true },
    ],
    defaultValue: 'option1',
  },
};

export const Accent: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'option1',
    variant: 'accent',
  },
};

export const Primary: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'option1',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'option1',
    variant: 'secondary',
  },
};

export const Small: Story = {
  args: {
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    options: [
      { label: 'Medium', value: 'medium' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    options: [
      { label: 'Large', value: 'large' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'large',
    size: 'lg',
  },
};
