# @ttoss/components

## About

<strong>@ttoss/components</strong> is a set of React components that you can use to build your apps using ttoss ecosystem.

## Getting Started

### Install @ttoss/components

```shell
pnpm add @ttoss/components @ttoss/ui
```

## Components

You can check all the components of the library `@ttoss/ui` on the [Storybook](https://storybook.ttoss.dev/?path=/story/components).

### Modal

Modal uses [react-modal](https://reactcommunity.org/react-modal/) under the hood, so the props are the same. The only difference is that the styles are theme-aware. You can [style the modal](https://reactcommunity.org/react-modal/styles/) using theme tokens, except that [array as value](https://theme-ui.com/sx-prop#responsive-values) don't work.

```tsx
import { Modal } from '@ttoss/components';
import { Box, Button, Flex, Text } from '@ttoss/ui';

/**
 * See https://reactcommunity.org/react-modal/accessibility/#app-element
 */
// Modal.setAppElement('#root'); // You can set the app element here or in prop `appElement`.

const Component = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Box id="modal-root">
      <Modal
        isOpen={isOpen}
        onAfterOpen={action('onAfterOpen')}
        onAfterClose={action('onAfterClose')}
        onRequestClose={() => {
          action('onRequestClose')();
          setIsOpen(false);
        }}
        appElement={document.getElementById('modal-root') as HTMLElement}
        style={{
          overlay: {
            backgroundColor: 'primary',
          },
          content: {
            backgroundColor: 'secondary',
            padding: ['lg', 'xl'], // Array as value don't work.
          },
        }}
      >
        <Flex>
          <Text>This is a modal.</Text>
          <Text>Here is the content.</Text>
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
