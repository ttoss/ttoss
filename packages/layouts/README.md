# @ttoss/layouts

**@ttoss/layouts** is a collection of React components that implement the layouts to use in your application.

## Installation

```shell
pnpm add @ttoss/layouts @ttoss/ui
```

## Quickstart

You can use the `Layout` component to add a layout to your application:

```tsx
import { Layout } from '@ttoss/layouts';

const App = () => (
  <Layout layout="StackedLayout">
    <Layout.Header>Header</Layout.Header>
    <Layout.Main>Main</Layout.Main>
    <Layout.Footer>Footer</Layout.Footer>
  </Layout>
);
```

Or you can use specifics components as `StackedLayout` to add a layout to your application:

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
