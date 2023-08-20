import { Box, Button, IconButton, Input, Text } from '@ttoss/ui';
import { BruttalTheme } from '@ttoss/theme/Bruttal';
import { Icon } from '@ttoss/react-icons';
import { Meta } from '@storybook/react';

const buttonVariantOptions = Object.keys(BruttalTheme.buttons || {});

const textColorOptions = Object.keys(BruttalTheme.colors || {});

const fontSizeOptions = Object.keys(BruttalTheme.fontSizes || {});

export default {
  title: 'Design System/Icons',
  args: {
    buttonVariant: 'primary',
    fontSize: 'base',
    textColor: 'text',
  },
  argTypes: {
    buttonVariant: {
      control: {
        type: 'select',
        options: buttonVariantOptions,
      },
    },
    fontSize: {
      control: {
        type: 'select',
        options: fontSizeOptions,
      },
    },
    textColor: {
      control: {
        type: 'select',
        options: textColorOptions,
      },
    },
  },
} as Meta;

const icons = [
  'add',
  'avatar',
  'calendar',
  'checkbox-checked',
  'checkbox-indeterminate',
  'checkbox-unchecked',
  'close',
  'copy',
  'delete',
  'error',
  'info',
  'paste',
  'picker-down',
  'picker-up',
  'picker-left',
  'picker-right',
  'radio-not-selected',
  'radio-selected',
  'refresh',
  'replicate',
  'small-close',
  'time',
  'view-off',
  'view-on',
  'warning',
];

export const Icons = ({
  buttonVariant,
  fontSize,
  textColor,
}: {
  buttonVariant: string;
  fontSize: string;
  textColor: string;
}) => {
  return (
    <Box
      as="table"
      sx={{
        textAlign: 'center',
        borderSpacing: 0,
        td: {
          padding: 'lg',
          border: '1px solid',
          borderColor: 'border',
        },
      }}
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Icon</th>
          <th>Text</th>
          <th>IconButton</th>
          <th>Button</th>
          <th>Input</th>
        </tr>
      </thead>
      <Box
        as="tbody"
        sx={{
          fontSize,
        }}
      >
        {icons.map((icon) => {
          return (
            <tr key={icon}>
              <td>{icon}</td>
              <td>
                <Text color={textColor}>
                  <Icon icon={icon} color={textColor} />
                </Text>
              </td>
              <td>
                <Text color={textColor}>
                  Text with <Icon inline icon={icon} /> icon
                </Text>
              </td>
              <td>
                <IconButton
                  variant={buttonVariant}
                  sx={{
                    fontSize,
                    height: 'auto',
                    width: 'auto',
                  }}
                >
                  <Icon icon={icon} />
                </IconButton>
              </td>
              <td>
                <Button
                  leftIcon={icon}
                  rightIcon={icon}
                  variant={buttonVariant}
                >
                  Button
                </Button>
              </td>
              <td>
                <Input
                  leadingIcon={icon}
                  trailingIcon={icon}
                  defaultValue="Input with icon"
                />
              </td>
            </tr>
          );
        })}
      </Box>
    </Box>
  );
};
