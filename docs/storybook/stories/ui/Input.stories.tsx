import radioButtonIcon from '@iconify/icons-carbon/radio-button';
import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Flex, Input, InputProps } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'UI/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Text input component with validation states, icons, and full theme integration. Supports various input types and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'filled', 'outline'],
      description: 'Visual variant of the input',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input interaction',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
  },
} as Meta;

const Template: StoryFn<InputProps> = (args) => {
  return <Input {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  placeholder: 'Placeholder text',
  value: 'Text',
};
Default.parameters = {
  docs: {
    description: {
      story: 'Basic text input with placeholder and default value.',
    },
  },
};

export const Disabled = Template.bind({});

Disabled.args = {
  ...Default.args,
  disabled: true,
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  trailingIcon: 'warning-alt',
  placeholder: 'Error',
  'aria-invalid': 'true',
};

export const IconsAsString = Template.bind({});
IconsAsString.args = {
  ...Default.args,
  trailingIcon: 'radio-not-selected',
  placeholder: 'Icon as string',
};

export const IconsAsSvgIcon = Template.bind({});
IconsAsSvgIcon.args = {
  ...Default.args,
  trailingIcon: radioButtonIcon,
  placeholder: 'Icon as SvgIcon',
};

export const GreaterFontSize = Template.bind({});
GreaterFontSize.args = {
  ...Default.args,
  trailingIcon: 'radio-not-selected',
  placeholder: 'Icon as string',
  sx: {
    fontSize: '2xl',
  },
};

export const InsideFlex = () => {
  return (
    <Flex
      sx={{
        height: '100px',
        width: '100%',
        border: 'default',
        padding: '4',
      }}
    >
      <Input
        sx={{ height: '100%', flex: 1 }}
        placeholder="Input inside container with padding"
      />
      <Input
        sx={{
          height: '100%',
          flex: 2,
          margin: '7',
          border: 'default',
          padding: '4',
        }}
        trailingIcon="radio-not-selected"
        placeholder="Input with padding and margin inside container with padding"
      />
    </Flex>
  );
};

export const WithLeadingIcon = Template.bind({});
WithLeadingIcon.args = {
  placeholder: 'Search...',
  leadingIcon: 'ant-design:search-outlined',
};
WithLeadingIcon.parameters = {
  docs: {
    description: {
      story: 'Input with a leading icon using the simplified string syntax.',
    },
  },
};

export const WithLeadingAndTrailingIcons = Template.bind({});
WithLeadingAndTrailingIcons.args = {
  placeholder: 'Enter email',
  leadingIcon: 'ant-design:mail-outlined',
  trailingIcon: 'ant-design:check-circle-outlined',
};
WithLeadingAndTrailingIcons.parameters = {
  docs: {
    description: {
      story: 'Input with both leading and trailing icons.',
    },
  },
};

export const WithIconTooltip = Template.bind({});
WithIconTooltip.args = {
  placeholder: 'Password',
  type: 'password',
  leadingIcon: {
    icon: 'ant-design:lock-outlined',
    tooltip: 'Your password must be at least 8 characters',
  },
  trailingIcon: {
    icon: 'ant-design:info-circle-outlined',
    tooltip: 'Click to see password requirements',
  },
};
WithIconTooltip.parameters = {
  docs: {
    description: {
      story:
        'Input with icons that display tooltips on hover. Hover over the icons to see the tooltips.',
    },
  },
};

export const WithClickableIcon = () => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      placeholder="Password"
      type={showPassword ? 'text' : 'password'}
      trailingIcon={{
        icon: showPassword
          ? 'ant-design:eye-outlined'
          : 'ant-design:eye-invisible-outlined',
        onClick: () => {
          return setShowPassword(!showPassword);
        },
        tooltip: showPassword ? 'Hide password' : 'Show password',
      }}
    />
  );
};
WithClickableIcon.parameters = {
  docs: {
    description: {
      story:
        'Input with a clickable trailing icon that toggles password visibility. Click the eye icon to show/hide the password.',
    },
  },
};

export const WithCustomTooltipProps = Template.bind({});
WithCustomTooltipProps.args = {
  placeholder: 'Search products',
  leadingIcon: {
    icon: 'ant-design:search-outlined',
    tooltip: 'Search by product name, SKU, or category',
    tooltipProps: {
      place: 'right',
      style: { maxWidth: '200px' },
    },
  },
};
WithCustomTooltipProps.parameters = {
  docs: {
    description: {
      story:
        'Input with custom tooltip properties for advanced tooltip customization.',
    },
  },
};

export const MixedIconTypes = Template.bind({});
MixedIconTypes.args = {
  placeholder: 'Mixed icon types',
  leadingIcon: 'ant-design:user-outlined', // String icon
  trailingIcon: radioButtonIcon, // SVG icon
};
MixedIconTypes.parameters = {
  docs: {
    description: {
      story:
        'Input demonstrating that you can mix string icons and SVG icons in the same component.',
    },
  },
};
