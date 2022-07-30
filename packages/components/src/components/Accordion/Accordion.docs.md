# Accordion

This components uses [react-accessible-accordion package](https://react-accessible-accordion.springload.co.nz/) as a base and apply [@ttoss/ui](/docs/modules/packages/ui/) styles.

## Storybook

[Stories](https://storybook.ttoss.dev/?path=/story/components-accordion)

## Example

```jsx
import { Accordion } from "@ttoss/components";
import { Text } from "@ttoss/ui";

const MyAccordion = () => {
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
```

## API

TODO

## Styles

TODO
