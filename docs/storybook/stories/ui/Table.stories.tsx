import { Box } from '@ttoss/ui';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'Ui/Table',
};

export default meta;

export const Example: StoryObj = {
  render: () => {
    return (
      <Box as="table">
        <Box as="tr">
          <Box as="th">Company</Box>
          <Box as="th">Contact</Box>
          <Box as="th">Country</Box>
        </Box>
        <Box as="tr">
          <Box as="td">Alfreds Futterkiste</Box>
          <Box as="td">Maria Anders</Box>
          <Box as="td">Germany</Box>
        </Box>
        <Box as="tr">
          <Box as="td">Centro comercial Moctezuma</Box>
          <Box as="td">Francisco Chang</Box>
          <Box as="td">Mexico</Box>
        </Box>
      </Box>
    );
  },
};
