import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from '@ttoss/ui2';

/**
 * Accessible accordion built on Ark UI.
 *
 * **Responsibility**: Disclosure — revealing or hiding related content in place.
 *
 * **Tokens**: action, content, spacing
 */
const meta: Meta = {
  title: 'Composites/Accordion',
  tags: ['autodocs'],
  parameters: {
    ttoss: {
      responsibility: 'Disclosure',
    },
  },
};

export default meta;
type Story = StoryObj;

/** Basic collapsible accordion. */
export const Default: Story = {
  render: () => {
    return (
      <Accordion.Root collapsible>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>What is ttoss?</Accordion.Trigger>
          <Accordion.Content>
            ttoss is a modular monorepo with reusable packages for product
            development teams.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>What are semantic tokens?</Accordion.Trigger>
          <Accordion.Content>
            Semantic tokens are stable, purpose-driven aliases that reference
            core tokens. Components consume them — never raw values.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>How does theme switching work?</Accordion.Trigger>
          <Accordion.Content>
            Themes override semantic token values via data-tt-theme and
            data-tt-mode attributes on the root element.
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

/** Multiple items open at once. */
export const Multiple: Story = {
  render: () => {
    return (
      <Accordion.Root multiple defaultValue={['item-1']}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Section A</Accordion.Trigger>
          <Accordion.Content>
            Content visible by default for section A.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Section B</Accordion.Trigger>
          <Accordion.Content>Content for section B.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Section C</Accordion.Trigger>
          <Accordion.Content>Content for section C.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};
