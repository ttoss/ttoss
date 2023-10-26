# @ttoss/components

## About

<strong>@ttoss/components</strong> is a set of React components that you can use to build your apps using ttoss ecosystem.

### ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) because [react-markdown](https://github.com/remarkjs/react-markdown).

## Getting Started

### Install @ttoss/components

```shell
pnpm add @ttoss/components @ttoss/ui @emotion/react
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
// Modal.setAppElement('#root'); Prefer using this static method over setting it on the component.

Modal.setAppElement('#modal-root');

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

### Markdown

Markdown uses [react-markdown](https://remarkjs.github.io/react-markdown/) under the hood, so the props are the same. You can update the elements as you want. Ex:

```tsx
const MARKDOWN_CONTENT = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5

Lorem ipsum dolor sit, amet consectetur adipisicing elit. Odit quasi dolorum aperiam fugiat earum expedita non eligendi similique id minus explicabo, eum facere nihil aspernatur libero! Sapiente aliquid tenetur dolor.

- Item 1
- Item 2
- Item 3

![Alt Text](https://fastly.picsum.photos/id/436/200/300.jpg?hmac=OuJRsPTZRaNZhIyVFbzDkMYMyORVpV86q5M8igEfM3Y "Alt Text")

[Google](https://google.com)
`;

const Component = () => {
  return (
    <Markdown
      components={{
        a: ({ children, ...props }) => (
          <Link {...props} quiet>
            {children}
          </Link>
        ),
      }}
    >
      {MARKDOWN_CONTENT}
    </Markdown>
  );
};
```
