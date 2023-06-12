import * as React from 'react';
import {
  Flex,
  Grid,
  Label,
  Select,
  Slider,
  Text,
  useTheme,
} from '@ttoss/ui/src';
import { Icon, type IconType, addIcon } from '@ttoss/react-icons';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'react-icons/Icon',
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e: any) => {
            return setFontSize(e.target.value);
          }}
        />

        <Label>Color</Label>
        <Select
          defaultValue={color}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  'download',
  'edit',
  'delete',
  'error',
  'info',
  'language',
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
  'three-dots-loading',
  'time',
  'upload',
  'view-off',
  'view-on',
  'warning',
  'warning-alt',
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

const customSearchIcon: IconType = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" fill="none">
  <path d="M15.8053 15.8013L21 21M10.5 7.5V13.5M7.5 10.5H13.5M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  width: 48,
  height: 48,
};

addIcon('custom-search', customSearchIcon);

export const CustomIcon = () => {
  return (
    <Flex sx={{ gap: 'lg', flexWrap: 'wrap' }}>
      <Flex
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          width: '120px',
          gap: 'md',
        }}
      >
        <Text sx={{ fontSize: '3xl', color: 'primary' }}>
          <Icon icon="custom-search" />
        </Text>

        <Text sx={{ textAlign: 'center' }}>custom-search</Text>
      </Flex>
    </Flex>
  );
};
