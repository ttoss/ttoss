# @ttoss/components

## About

<strong>@ttoss/components</strong> is a set of React components that you can use to build your apps using ttoss ecosystem.

### ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) because [react-markdown](https://github.com/remarkjs/react-markdown).

## Getting Started

### Install @ttoss/components

```shell
pnpm add @ttoss/components @ttoss/ui @emotion/react @ttoss/react-hooks
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

### Search

`Search` is a component that integrates an input field with debouncing functionality, making it ideal for search bars where you want to limit the rate of search queries based on user input.

It uses the `useDebounce` hook from `@ttoss/react-hooks` to delay the search action until the user has stopped typing for a specified duration, which helps to prevent unnecessary or excessive queries.

```tsx
import React, { useState } from 'react';
import { Search } from '@ttoss/components';
import { Box } from '@ttoss/ui';

const SearchComponent = () => {
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (newValue) => {
    setSearchText(newValue);
    // Perform search or update logic here
  };

  return (
    <Box>
      <Search
        value={searchText}
        onChange={handleSearchChange}
        loading={/* loading state here */}
        debounce={500} // Adjust the debounce time as needed
      />
    </Box>
  );
};
```

In this example, the `Search` component receives the current search text and a handler function to update this text. The `loading` prop can be used to display a loading indicator, and the `debounce` prop controls the debounce delay.

### FormSequence

`FormSequence` is a versatile component designed to handle multi-step forms, making it an ideal choice for guiding users through a series of questions or data entry steps. It's built to be flexible, allowing for various types of fields and custom content at each step.

#### How FormSequence Works

`FormSequence` provides a structured way to present a series of steps within a form. Each step can have its unique fields, questions, and informational content, guiding the user seamlessly from one step to the next.

#### Implementing FormSequence

Here’s how you can implement `FormSequence`:

```tsx
import React from 'react';
import { FormSequence, FormSequenceHeader } from '@ttoss/components';

// Define your steps array here
const steps = [
  // ...your step objects
];

// Define your custom header props
const headerProps = {
  variant: 'logo', // or 'titled'
  // Other props based on the chosen variant
};

const MyFormSequenceComponent = () => {
  // Define form submission handler
  const handleSubmit = (formData) => {
    console.log('Form Data:', formData);
    // Handle form submission
  };

  return (
    <FormSequence header={headerProps} steps={steps} onSubmit={handleSubmit} />
  );
};
```

In this example, `FormSequence` takes in an array of step objects, each representing a different part of the form. The `onSubmit` prop is a function that handles the submission of the entire form sequence.

#### Customizing Steps

Each step in the `FormSequence` can be customized with different fields, flow messages, and more. Here's an example structure of a step object:

```tsx
const step = {
  label: 'Step Label',
  question: 'What is your question?',
  flowMessage: {
    variant: 'image-text', // or other variants
    src: 'path-to-image',
    description: 'A brief description or additional content',
  },
  fields: [
    // Define your fields here (input, radio, etc.)
  ],
};
```

#### Customizing Headers

1. **Logo Header:**

   ```tsx
   const logoHeaderProps = {
     variant: 'logo',
     src: 'path-to-your-logo-image',
     onClose: () => console.log('Close button clicked'),
   };
   ```

2. **Titled Header:**
   ```tsx
   const titledHeaderProps = {
     variant: 'titled',
     title: 'Your Title',
     leftIcon: 'icon-type',
     rightIcon: 'icon-type',
     leftIconClick: () => console.log('Left icon clicked'),
     rightIconClick: () => console.log('Right icon clicked'),
   };
   ```

#### Props

- `header`: An object representing the header configuration. It can be either `FormSequenceHeaderLogoProps` or `FormSequenceHeaderTitledProps`.
- `steps`: An array of step objects, each representing a step in the form sequence.
- `onSubmit`: A function that handles the submission of the form.

##### Header Props

- **For Logo Header (`FormSequenceHeaderLogoProps`):**

  - `variant`: Set to `'logo'`.
  - `src`: The source URL for the logo image.
  - `onClose`: A function to handle the close button click event.

- **For Titled Header (`FormSequenceHeaderTitledProps`):**
  - `variant`: Set to `'titled'`.
  - `title`: The title text.
  - `leftIcon` and `rightIcon`: Icon types for left and right icons.
  - `leftIconClick` and `rightIconClick`: Functions to handle clicks on left and right icons.

Each step object typically contains:

- `label`: A label for the step.
- `question`: A question or title for the step.
- `flowMessage`: An object that provides additional information or content related to the step.
- `fields`: An array of field objects for collecting user input.

By using `FormSequence`, you can create complex, multi-step forms with ease, guiding users through each step with clarity and precision.
