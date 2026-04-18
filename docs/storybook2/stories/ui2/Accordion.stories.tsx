import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@ttoss/ui2';

const meta: Meta<typeof Accordion> = {
  title: 'ui2/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    evaluation: {
      description:
        'Authorial emphasis (`primary` standard chrome, `muted` for sidebars / dense lists).',
      control: 'inline-radio',
      options: ['primary', 'muted'],
    },
    allowsMultipleExpanded: {
      description: 'Allow more than one item to stay expanded simultaneously.',
      control: 'boolean',
    },
    isDisabled: {
      description:
        'Disables the entire group. Each item also accepts its own `isDisabled`.',
      control: 'boolean',
    },
  },
  args: {
    evaluation: 'primary',
    allowsMultipleExpanded: false,
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const sampleItems = (
  <>
    <AccordionItem id="terms">
      <AccordionTrigger>Terms of service</AccordionTrigger>
      <AccordionPanel>
        You agree not to misuse the service. We may suspend access if you
        violate the rules. Read the full terms before continuing.
      </AccordionPanel>
    </AccordionItem>
    <AccordionItem id="privacy">
      <AccordionTrigger>Privacy policy</AccordionTrigger>
      <AccordionPanel>
        We collect the minimum personal data required to operate the service and
        never sell it to third parties.
      </AccordionPanel>
    </AccordionItem>
    <AccordionItem id="cookies">
      <AccordionTrigger>Cookie preferences</AccordionTrigger>
      <AccordionPanel>
        We use functional cookies only. Analytics cookies are opt-in.
      </AccordionPanel>
    </AccordionItem>
  </>
);

/**
 * Default — single expansion, primary evaluation.
 *
 * Click a header to toggle the panel. Only one panel can be open at a time.
 */
export const Default: Story = {
  args: {},
  render: (args) => {
    return <Accordion {...args}>{sampleItems}</Accordion>;
  },
};

/**
 * MultipleExpanded — `allowsMultipleExpanded` lets several panels stay open.
 */
export const MultipleExpanded: Story = {
  args: {
    allowsMultipleExpanded: true,
    defaultExpandedKeys: ['terms', 'privacy'],
  },
  render: (args) => {
    return <Accordion {...args}>{sampleItems}</Accordion>;
  },
};

/**
 * DefaultExpanded — start with one item open via `defaultExpandedKeys`.
 */
export const DefaultExpanded: Story = {
  args: { defaultExpandedKeys: ['privacy'] },
  render: (args) => {
    return <Accordion {...args}>{sampleItems}</Accordion>;
  },
};

/**
 * Muted — subdued chrome for sidebars or secondary surfaces.
 */
export const Muted: Story = {
  args: { evaluation: 'muted' },
  render: (args) => {
    return <Accordion {...args}>{sampleItems}</Accordion>;
  },
};

/**
 * Disabled — group-level disabled. Triggers ignore clicks and surface
 * `disabled` state tokens.
 */
export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => {
    return <Accordion {...args}>{sampleItems}</Accordion>;
  },
};

/**
 * SideBySide — primary and muted shown together for visual comparison.
 *
 * Demonstrates that `vars.colors.navigation.{primary|muted}` are the only
 * two evaluations defined for the Disclosure entity (per ENTITY_EVALUATION).
 */
export const SideBySide: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <div
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <div>
          <strong>primary</strong>
          <Accordion evaluation="primary" defaultExpandedKeys={['terms']}>
            {sampleItems}
          </Accordion>
        </div>
        <div>
          <strong>muted</strong>
          <Accordion evaluation="muted" defaultExpandedKeys={['terms']}>
            {sampleItems}
          </Accordion>
        </div>
      </div>
    );
  },
};
