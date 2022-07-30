# Modal

This components uses [react-modal package](http://reactcommunity.org/react-modal) as a base and apply [@ttoss/ui](/docs/modules/packages/ui/) styles.

## Storybook

[Stories](https://storybook.ttoss.dev/?path=/story/components-modal)

## Example

```jsx
import { Modal } from "@ttoss/components";
import { Box, Flex, Text } from "@ttoss/ui";

const Component = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Box>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => {
          setIsOpen(false);
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Text>This is a modal.</Text>
          <Button
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close Modal
          </Button>
        </Flex>
      </Modal>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open Modal
      </Button>
    </Box>
  );
};
```

## API

This components extends the API of [react-modal package](http://reactcommunity.org/react-modal/#usage).
