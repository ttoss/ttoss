# @ttoss/layouts

**@ttoss/layouts** is a collection of React components that implement the layouts to use in your application.

## Installation

```shell
pnpm add @ttoss/layouts @ttoss/ui @emotion/react
```

## Quickstart

Use a layout as `StackedLayout` to add specific layout to your application:

```tsx
import { Layout, StackedLayout } from '@ttoss/layouts';

const App = () => (
  <StackedLayout>
    <Layout.Header>Header</Layout.Header>
    <Layout.Main>Main</Layout.Main>
    <Layout.Footer>Footer</Layout.Footer>
  </StackedLayout>
);
```

## Layouts

Check the [Layouts Stories](http://localhost:6006/?path=/story/layouts-layout) to see the available layouts.

## Custom Layout Components

You can create your own layout components by using the `Layout` sub-components:

```tsx
import { Layout, StackedLayout } from '@ttoss/layouts';

const CustomHeader = (props) => (
  <Layout.Header {...props} style={{ backgroundColor: 'red' }}>
    Header
  </Layout.Header>
);

CustomHeader.displayName = Layout.Header.displayName;

const App = () => (
  <StackedLayout>
    <CustomHeader />
    <Layout.Main>Main</Layout.Main>
    <Layout.Footer>Footer</Layout.Footer>
  </StackedLayout>
);
```

For the layout to work correctly, you must use the `displayName` property of the `Layout` sub-components, because the layout components use the `displayName` to identify the layout sub-components.

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
