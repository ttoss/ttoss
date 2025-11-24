import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Flex, TooltipIcon, TooltipIconProps } from '@ttoss/ui';
import { action } from 'storybook/actions';

type Story = StoryObj<typeof TooltipIcon>;

export default {
  title: 'UI/TooltipIcon',
  component: TooltipIcon,
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    icon: {
      control: 'text',
    },
  },
} as Meta<typeof TooltipIcon>;

export const Default: Story = {
  args: {
    icon: 'info-circle',
    tooltip: 'This is an informational tooltip',
  },
};

export const VariantInfo: Story = {
  args: {
    icon: 'info-circle',
    tooltip: 'Information tooltip with info variant',
    variant: 'info',
  },
};

export const VariantSuccess: Story = {
  args: {
    icon: 'ant-design:check-circle-filled',
    tooltip: 'Success tooltip with success variant',
    variant: 'success',
  },
};

export const VariantWarning: Story = {
  args: {
    icon: 'warning-alt',
    tooltip: 'Warning tooltip with warning variant',
    variant: 'warning',
  },
};

export const VariantError: Story = {
  args: {
    icon: 'ant-design:close-circle-filled',
    tooltip: 'Error tooltip with error variant',
    variant: 'error',
  },
};

export const WithClick: Story = {
  args: {
    icon: 'ant-design:info-circle-outlined',
    tooltip: 'Click me!',
    onClick: action('icon-clicked'),
  },
};

export const WithoutTooltip: Story = {
  args: {
    icon: 'ant-design:star-filled',
  },
};

export const WithCustomSx: Story = {
  args: {
    icon: 'ant-design:heart-filled',
    tooltip: 'Custom styled icon',
    sx: {
      color: 'red',
      fontSize: '2xl',
    },
  },
};

export const WithTooltipProps: Story = {
  args: {
    icon: 'ant-design:question-circle-outlined',
    tooltip: 'This tooltip opens on click',
    tooltipProps: {
      openOnClick: true,
      place: 'bottom',
    },
  },
};

export const MultipleIcons: Story = {
  render: () => {
    const icons: Array<{
      icon: TooltipIconProps['icon'];
      tooltip: string;
      variant: TooltipIconProps['variant'];
    }> = [
      { icon: 'info-circle', tooltip: 'Information', variant: 'info' },
      {
        icon: 'ant-design:check-circle-filled',
        tooltip: 'Success',
        variant: 'success',
      },
      { icon: 'warning-alt', tooltip: 'Warning', variant: 'warning' },
      {
        icon: 'ant-design:close-circle-filled',
        tooltip: 'Error',
        variant: 'error',
      },
    ];

    return (
      <Flex
        sx={{
          gap: '4',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {icons.map((iconConfig, index) => {
          return (
            <TooltipIcon
              key={index}
              icon={iconConfig.icon}
              tooltip={iconConfig.tooltip}
              variant={iconConfig.variant}
            />
          );
        })}
      </Flex>
    );
  },
};

export const ClickableIcons: Story = {
  render: () => {
    return (
      <Flex
        sx={{
          gap: '4',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TooltipIcon
          icon="ant-design:edit-filled"
          tooltip="Edit"
          onClick={action('edit-clicked')}
        />
        <TooltipIcon
          icon="delete"
          tooltip="Delete"
          onClick={action('delete-clicked')}
        />
        <TooltipIcon
          icon="ant-design:download-outlined"
          tooltip="Download"
          onClick={action('download-clicked')}
        />
      </Flex>
    );
  },
};

export const DifferentSizes: Story = {
  render: () => {
    const sizes = [
      { label: 'Small', fontSize: 'md' },
      { label: 'Medium', fontSize: 'xl' },
      { label: 'Large', fontSize: '3xl' },
    ];

    return (
      <Flex
        sx={{
          gap: '6',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {sizes.map((size) => {
          return (
            <Flex
              key={size.label}
              sx={{ flexDirection: 'column', alignItems: 'center', gap: '2' }}
            >
              <TooltipIcon
                icon="ant-design:star-filled"
                tooltip={`${size.label} icon`}
                sx={{ fontSize: size.fontSize }}
              />
              <span style={{ fontSize: '12px' }}>{size.label}</span>
            </Flex>
          );
        })}
      </Flex>
    );
  },
};
