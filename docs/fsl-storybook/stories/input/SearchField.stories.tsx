import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SearchField,
  SearchFieldControl,
  SearchFieldLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof SearchField> = {
  title: 'Input/SearchField',
  component: SearchField,
  tags: ['autodocs'],
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

/**
 * Required, and marked. The flag reaches the slot label through the composite
 * scope, taken from the root's render props — a slot label cannot read the
 * root's prop. `SearchField` has no one-line authoring form yet, so this is the
 * only shape it has (forms item D).
 */
export const Required: Story = {
  render: () => {
    return (
      <SearchField clearLabel="Clear search" isRequired>
        <SearchFieldLabel>Search members</SearchFieldLabel>
        <SearchFieldControl />
      </SearchField>
    );
  },
};
