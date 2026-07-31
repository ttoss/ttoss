import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComboBox, ComboBoxItem } from '@ttoss/fsl-ui';

const ZONES = [
  ['Europe/Lisbon', 'Lisbon'],
  ['Europe/London', 'London'],
  ['Europe/Berlin', 'Berlin'],
  ['Europe/Madrid', 'Madrid'],
  ['America/Sao_Paulo', 'São Paulo'],
  ['America/New_York', 'New York'],
  ['America/Los_Angeles', 'Los Angeles'],
  ['Asia/Tokyo', 'Tokyo'],
  ['Asia/Singapore', 'Singapore'],
  ['Australia/Sydney', 'Sydney'],
] as const;

const zoneItems = () => {
  return ZONES.map(([id, label]) => {
    return (
      <ComboBoxItem key={id} id={id}>
        {label}
      </ComboBoxItem>
    );
  });
};

const meta: Meta<typeof ComboBox> = {
  title: 'Input/ComboBox',
  component: ComboBox,
  tags: ['autodocs'],
  subcomponents: { ComboBoxItem },
};

export default meta;

type Story = StoryObj<typeof ComboBox>;

/** Typing filters the list; the chevron opens it unfiltered. */
export const Default: Story = {
  render: () => {
    return (
      <ComboBox label="Timezone" placeholder="Type a city">
        {zoneItems()}
      </ComboBox>
    );
  },
};

/** A preselected value — the input shows the option's text, not its id. */
export const WithSelection: Story = {
  render: () => {
    return (
      <ComboBox label="Timezone" defaultSelectedKey="Asia/Tokyo">
        {zoneItems()}
      </ComboBox>
    );
  },
};

/** Helper text linked to the input via `aria-describedby`. */
export const WithDescription: Story = {
  render: () => {
    return (
      <ComboBox
        label="Timezone"
        description="Deploy timestamps are shown in this zone."
        defaultSelectedKey="Europe/Lisbon"
      >
        {zoneItems()}
      </ComboBox>
    );
  },
};

/**
 * Validation is the `invalid` State, never an evaluation variant — and unlike
 * `Select`, ComboBox has a `validationMessage` part to render the reason in.
 */
export const Invalid: Story = {
  render: () => {
    return (
      <ComboBox label="Timezone" isInvalid errorMessage="Pick a timezone.">
        {zoneItems()}
      </ComboBox>
    );
  },
};

/** Accepts a value outside the set — the freeform channel that makes it Input. */
export const AllowsCustomValue: Story = {
  render: () => {
    return (
      <ComboBox
        label="Timezone"
        allowsCustomValue
        description="Not in the list? Type it anyway."
      >
        {zoneItems()}
      </ComboBox>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <ComboBox label="Timezone" isDisabled defaultSelectedKey="Europe/Lisbon">
        {zoneItems()}
      </ComboBox>
    );
  },
};

/** Required, and marked — the envelope's marker, hidden from assistive tech. */
export const Required: Story = {
  render: () => {
    return (
      <ComboBox label="Timezone" isRequired>
        {zoneItems()}
      </ComboBox>
    );
  },
};
