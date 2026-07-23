import type { Meta, StoryObj } from '@storybook/react-vite';
import { GridList, GridListItem } from '@ttoss/fsl-ui';

const meta: Meta<typeof GridList> = {
  title: 'Collection/GridList',
  component: GridList,
  subcomponents: { GridListItem },
};

export default meta;

type Story = StoryObj<typeof GridList>;

export const Default: Story = {
  render: () => {
    return (
      <GridList aria-label="Files" selectionMode="multiple">
        <GridListItem id="report" textValue="Report">
          Report.pdf
        </GridListItem>
        <GridListItem id="notes" textValue="Notes">
          Notes.txt
        </GridListItem>
        <GridListItem id="deck" textValue="Deck">
          Deck.key
        </GridListItem>
      </GridList>
    );
  },
};
