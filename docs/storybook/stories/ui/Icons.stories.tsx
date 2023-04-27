import {
  Flex,
  Grid,
  Icon,
  Label,
  Select,
  Slider,
  Text,
  useTheme,
} from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import React from 'react';

export default {
  title: 'UI/Icon',
  component: Icon,
} as Meta;

const Template: Story = (args) => {
  const icons = [
    'ant-design:down-square-filled',
    'ant-design:up-square-filled',
    'ant-design:arrow-left-outlined',
    'ant-design:arrow-right-outlined',
    args.dynamicIcon,
  ];

  return (
    <Grid columns={3}>
      {icons.map((icon) => {
        return (
          <Flex
            key={icon}
            sx={{ flexDirection: 'column', alignItems: 'center' }}
          >
            <Text sx={{ fontSize: '40px' }}>
              <Icon icon={icon} />
            </Text>
            <Text sx={{ fontSize: '12px' }}>{icon}</Text>
          </Flex>
        );
      })}
    </Grid>
  );
};

export const Example = Template.bind({});

Example.args = {
  dynamicIcon: 'mdi-light:home',
};

const TemplateDynamic: Story = (args) => {
  const { theme } = useTheme();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const colors = Object.keys(theme.rawColors).map((key) => {
    return {
      key,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      value: theme.rawColors[key] as string,
    };
  });

  const [fontSize, setFontSize] = React.useState(50);
  const [color, setColor] = React.useState(colors[1].value);

  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Flex sx={{ flexDirection: 'column' }}>
        <Label>Size: {fontSize}px</Label>

        <Slider
          defaultValue={50}
          max={200}
          onChange={(e: any) => {
            return setFontSize(e.target.value);
          }}
        />

        <Label>Color</Label>
        <Select
          defaultValue={color}
          onChange={(e: any) => {
            return setColor(e.target.value);
          }}
        >
          {colors.map(({ key, value }) => {
            return (
              <option key={key} value={key as string}>
                {`${key}: ${value}`}
              </option>
            );
          })}
        </Select>
      </Flex>
      <Text sx={{ fontSize: `${fontSize}px`, color, marginTop: 5 }}>
        <Icon icon={args.icon} />
      </Text>
    </Flex>
  );
};

export const Dynamic = TemplateDynamic.bind({});

Dynamic.args = {
  icon: 'mdi-light:home',
};

const CORE_ICONS = [
  'add',
  'arrow-right',
  'attachment',
  'avatar',
  'caret-down',
  'caret-up',
  'calendar',
  'checkbox-checked',
  'checkbox-indeterminate',
  'checkbox-unchecked',
  'check',
  'check-mark',
  'close',
  'copy',
  'edit',
  'delete',
  'error',
  'info',
  'loading',
  'paste',
  'picker-down',
  'picker-up',
  'picker-left',
  'picker-right',
  'radio-not-selected',
  'radio-selected',
  'refresh',
  'replicate',
  'subtract',
  'success-circle',
  'small-close',
  'time',
  'upload',
  'view-off',
  'view-on',
  'warning',
];

export const CoreIcons = () => {
  return (
    <Flex sx={{ gap: 'lg', flexWrap: 'wrap' }}>
      {CORE_ICONS.map((icon) => {
        return (
          <Flex
            sx={{
              flexDirection: 'column',
              alignItems: 'center',
              width: '120px',
              gap: 'md',
            }}
            key={icon}
          >
            <Text sx={{ fontSize: '2xl' }}>
              <Icon icon={icon} />
            </Text>

            <Text sx={{ textAlign: 'center' }}>{icon}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
};
