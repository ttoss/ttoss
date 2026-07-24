import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SearchField,
  SearchFieldControl,
  SearchFieldLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof SearchField> = {
  title: 'Input/SearchField',
  component: SearchField,
  subcomponents: { SearchFieldLabel, SearchFieldControl },
};

export default meta;

type Story = StoryObj<typeof SearchField>;

export const Default: Story = {
  render: () => {
    return (
      <SearchField clearLabel="Clear search">
        <SearchFieldLabel>Search members</SearchFieldLabel>
        <SearchFieldControl />
      </SearchField>
    );
  },
};
