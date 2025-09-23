import { Meta, Story } from '@storybook/react-webpack5';
import { Box, Flex, Grid, Text, useTheme } from '@ttoss/ui';

type ColorProps = {
  name: string;
  hex: string;
};

const Color = ({ hex, name }: ColorProps) => {
  const boxSize = '137px';

  return (
    <Flex sx={{ gap: 3, alignItems: 'center' }}>
      <Box
        sx={{
          borderRadius: 4,
          width: boxSize,
          height: boxSize,
          backgroundColor: hex,
          boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
        }}
      />
      <Flex sx={{ flexDirection: 'column', gap: 2 }}>
        <Text sx={{ fontWeight: 'light' }}>{name}</Text>

        <Text>Hex: {hex}</Text>
      </Flex>
    </Flex>
  );
};

export default {
  title: 'Design System/Colors',
  component: Color,
} as Meta;

const Template: Story = () => {
  const { theme } = useTheme();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const colors = Object.keys(theme.rawColors).map((key) => {
    return {
      name: key,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hex: theme.rawColors[key] as string,
    };
  });

  return (
    <Grid columns={3}>
      {colors.map((color) => {
        return <Color key={color.name} {...color} />;
      })}

      {!!theme.borders?.[1] && (
        <Flex sx={{ alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: '137px',
              height: '137px',
              backgroundColor: 'white',
              border: 1,
              borderRadius: '10px',
            }}
          />

          <Flex sx={{ flexDirection: 'column', gap: 2 }}>
            <Text sx={{ fontWeight: 'light' }}>Border</Text>

            <Text>Spec: {String(theme.borders?.[1])}</Text>
          </Flex>
        </Flex>
      )}
    </Grid>
  );
};

export const Example = Template.bind({});
