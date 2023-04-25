# @ttoss/ui

**@ttoss/ui** is a library of React low level components for building user interfaces and defining the design system of your application. It is built on top of [Theme UI: The Design Graph Framework](https://theme-ui.com/), so that you'll be able to consult the [Theme UI documentation](https://theme-ui.com/getting-started) to learn more about the design system and the components.

## Installation

```shell
pnpm add @ttoss/ui
```

## Quick start

Create a theme object to define the design tokens of your application.

```ts
import type { Theme } from '@ttoss/ui';

export const theme: Theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#33e',
  },
};
```

Pass your theme to the `ThemeProvider` component at the root of your application.

```tsx
import { Heading, ThemeProvider } from '@ttoss/ui';
import { theme } from './theme';

export const App = () => (
  <ThemeProvider theme={theme}>
    <Heading as="h1" sx={{ color: 'primary' }}>
      Hello
    </Heading>
  </ThemeProvider>
);
```

Now, you can use the components of the library in your application and access the [design tokens](/docs/design/design-tokens) defined in your theme through the [`sx` prop](https://theme-ui.com/getting-started#sx-prop).

```tsx
import { Flex, Text, Box, Button } from '@ttoss/ui';

export const Component = () => {
  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Text>Text Value</Text>
      <Button
        sx={{
          backgroundColor: 'primary',
        }}
      >
        Button Primary
      </Button>
    </Flex>
  );
};
```

:::note Note

You don't need to use the custom `/** @jsxImportSource theme-ui */` pragma if you use the `sx` prop directly on the components of the library.

:::

## Components

You can check all the components of the library `@ttoss/ui` on the [Storybook](https://storybook.ttoss.dev/?path=/story/ui).

### Global

Wrapper around the Emotion Global component, made Theme UI theme-aware.

```tsx
import { Global } from '@ttoss/ui';

export const Provider = (props) => {
  return (
    <Global
      styles={{
        button: {
          m: 0,
          bg: 'primary',
          color: 'background',
          border: 0,
        },
      }}
    />
  );
};
```
