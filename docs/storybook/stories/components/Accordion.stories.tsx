import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from '@ttoss/components/Accordion';
import { Text } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible accordion component with collapsible content sections. Supports single or multiple expanded items, pre-expanded items, and follows WAI-ARIA accordion pattern.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

/**
 * Default accordion with two items.
 * Only one item can be expanded at a time (default behavior).
 */
export const Default: Story = {
  render: () => {
    return (
      <Accordion>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              What harsh truths do you prefer to ignore?
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              Exercitation in fugiat est ut ad ea cupidatat ut in cupidatat
              occaecat ut occaecat consequat est minim minim esse tempor laborum
              consequat esse adipisicing eu reprehenderit enim.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              Is free will real or just an illusion?
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              In ad velit in ex nostrud dolore cupidatat consectetur ea in ut
              nostrud velit in irure cillum tempor laboris sed adipisicing eu
              esse duis nulla non.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    );
  },
};

/**
 * Accordion allowing multiple items to be expanded simultaneously.
 */
export const MultipleExpanded: Story = {
  render: () => {
    return (
      <Accordion allowMultipleExpanded>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>Section 1</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              Content for section 1. You can expand multiple sections at once.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>Section 2</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              Content for section 2. This can be expanded while section 1 is
              also expanded.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>Section 3</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              Content for section 3. All three can be expanded together.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    );
  },
};

/**
 * Accordion with pre-expanded items.
 * The first item is expanded by default.
 */
export const PreExpanded: Story = {
  render: () => {
    return (
      <Accordion preExpanded={['item-1']}>
        <AccordionItem uuid="item-1">
          <AccordionItemHeading>
            <AccordionItemButton>Pre-expanded Section</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>This section is expanded by default.</Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem uuid="item-2">
          <AccordionItemHeading>
            <AccordionItemButton>Collapsed Section</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>This section starts collapsed.</Text>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    );
  },
};

/**
 * Accordion allowing all items to be collapsed.
 * By default, if there's one expanded item, it cannot be collapsed.
 * With allowZeroExpanded, all items can be collapsed.
 */
export const AllowZeroExpanded: Story = {
  render: () => {
    return (
      <Accordion allowZeroExpanded>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>Collapsible Section</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>
              You can collapse this section even if it&apos;s the only expanded
              one.
            </Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              Another Collapsible Section
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>All items can be collapsed at once.</Text>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    );
  },
};

const WithOnExpandedChangeComponent = () => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  return (
    <div>
      <Text sx={{ marginBottom: 3 }}>
        Expanded items:{' '}
        {expandedItems.length > 0 ? expandedItems.join(', ') : 'None'}
      </Text>
      <Accordion
        allowMultipleExpanded
        onExpandedChange={(items) => {
          return setExpandedItems(items);
        }}
      >
        <AccordionItem uuid="first">
          <AccordionItemHeading>
            <AccordionItemButton>First Item</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>Content of first item.</Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem uuid="second">
          <AccordionItemHeading>
            <AccordionItemButton>Second Item</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>Content of second item.</Text>
          </AccordionItemPanel>
        </AccordionItem>
        <AccordionItem uuid="third">
          <AccordionItemHeading>
            <AccordionItemButton>Third Item</AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <Text>Content of third item.</Text>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

/**
 * Accordion with onExpandedChange callback to track expanded items.
 */
export const WithOnExpandedChange: Story = {
  render: () => {
    return <WithOnExpandedChangeComponent />;
  },
};
