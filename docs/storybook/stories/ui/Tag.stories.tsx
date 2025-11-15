import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Tag, TagProps } from '@ttoss/ui';

export default {
  title: 'UI/Tag',
  component: Tag,
  parameters: {
    docs: {
      description: {
        component:
          'Tag component to highlight and categorize items with various visual variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'accent',
        'positive',
        'caution',
        'muted',
        'negative',
        'primary',
        'secondary',
        'default',
      ],
      description: 'Visual style variant of the Tag',
    },
    children: {
      control: 'text',
      description: 'Content inside the Tag',
    },
  },
} as Meta;

const Template: StoryFn<TagProps> = (args) => {
  return <Tag {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  children: 'Default Tag',
  variant: 'default',
};

export const Accent = Template.bind({});
Accent.args = {
  children: 'Accent Tag',
  variant: 'accent',
};

export const Positive = Template.bind({});
Positive.args = {
  children: 'Positive Tag',
  variant: 'positive',
};

export const Caution = Template.bind({});
Caution.args = {
  children: 'Caution Tag',
  variant: 'caution',
};

export const Muted = Template.bind({});
Muted.args = {
  children: 'Muted Tag',
  variant: 'muted',
};

export const Negative = Template.bind({});
Negative.args = {
  children: 'Negative Tag',
  variant: 'negative',
};

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Tag',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Tag',
  variant: 'secondary',
};
