import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof Accordion> = {
  title: 'Disclosure/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem, AccordionTrigger, AccordionPanel },
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => {
    return (
      <Accordion>
        <AccordionItem id="billing">
          <AccordionTrigger>How does billing work?</AccordionTrigger>
          <AccordionPanel>
            Plans are billed monthly per workspace, prorated on change.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem id="cancel">
          <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
          <AccordionPanel>
            Yes — the workspace stays active until the end of the period.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  },
};
