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
 * root's prop.
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

/**
 * The one-line form, new in forms item D. Until then this was the only field in
 * the family with no prop form at all — props rendered nothing but the root — so
 * the whole envelope had to be composed by hand. Both forms remain; mixing them
 * is a compile error rather than a precedence rule.
 */
export const OneLine: Story = {
  render: () => {
    return (
      <SearchField
        clearLabel="Clear search"
        label="Search members"
        description="Search by name or email."
        placeholder="Type a name…"
      />
    );
  },
};

/**
 * The clear button appears only once there is something to clear. React Aria
 * publishes emptiness as `data-empty` for CSS to act on; this package ships no
 * CSS, so the button is gated on the root's `isEmpty` render prop instead.
 */
export const WithValue: Story = {
  render: () => {
    return (
      <SearchField
        clearLabel="Clear search"
        label="Search members"
        defaultValue="ada lovelace"
      />
    );
  },
};
