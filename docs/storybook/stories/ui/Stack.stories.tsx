import { Box, Stack } from '@ttoss/ui';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Stack> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'Ui/Stack',
  component: Stack,
};

export default meta;

type Story = StoryObj<typeof Stack>;

const Boxes = () => {
  return (
    <>
      <Box sx={{ height: 100, bg: 'primary' }}>Box 1</Box>
      <Box sx={{ height: 100, bg: 'secondary' }}>Box 2</Box>
      <Box sx={{ height: 100, width: 100, bg: 'accent' }}>
        Box 3 - width 100px
      </Box>
      <Box sx={{ height: 100, bg: 'highlight' }}>Box 4</Box>
    </>
  );
};

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Example: Story = {
  render: () => {
    return (
      <Stack
        sx={{
          gap: 'md',
        }}
      >
        <Boxes />
      </Stack>
    );
  },
};
