import { Accordion } from '@ttoss/components';
import { Meta, Story } from '@storybook/react';
import { Text } from '@ttoss/ui';

export default {
  title: 'Components/Accordion',
  component: Accordion,
} as Meta;

const Template: Story = () => {
  return (
    <Accordion>
      <Accordion.Item>
        <Accordion.ItemHeading>
          <Accordion.ItemButton>
            What harsh truths do you prefer to ignore?
          </Accordion.ItemButton>
        </Accordion.ItemHeading>
        <Accordion.ItemPanel>
          <Text>
            Exercitation in fugiat est ut ad ea cupidatat ut in cupidatat
            occaecat ut occaecat consequat est minim minim esse tempor laborum
            consequat esse adipisicing eu reprehenderit enim.
          </Text>
        </Accordion.ItemPanel>
      </Accordion.Item>
      <Accordion.Item>
        <Accordion.ItemHeading>
          <Accordion.ItemButton>
            Is free will real or just an illusion?
          </Accordion.ItemButton>
        </Accordion.ItemHeading>
        <Accordion.ItemPanel>
          <Text>
            In ad velit in ex nostrud dolore cupidatat consectetur ea in ut
            nostrud velit in irure cillum tempor laboris sed adipisicing eu esse
            duis nulla non.
          </Text>
        </Accordion.ItemPanel>
      </Accordion.Item>
    </Accordion>
  );
};

export const Example = Template.bind({});
