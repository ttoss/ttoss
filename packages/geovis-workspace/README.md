# @ttoss/geovis-workspace

A React component that composes a sidebar-driven workspace around a main
content area (typically a map). Both sidebars are configured through a single
`spec` object and only render when defined.

## Installation

```bash
pnpm add @ttoss/geovis-workspace
```

## Storybook

Interactive examples are available on [Storybook](https://storybook.ttoss.dev/).

## Usage

```tsx
import {
  GeovisWorkspace,
  type GeovisWorkspaceSpec,
} from '@ttoss/geovis-workspace';

const spec: GeovisWorkspaceSpec = {
  leftSidebar: {
    menus: [
      {
        id: 'population',
        title: 'População',
        items: [
          { value: '5year-65plus', label: 'Faixa (% da pop 65+)' },
          { value: '0-14', label: '0 a 14 anos' },
        ],
      },
      {
        id: 'economy',
        title: 'Economia',
        defaultValue: 'gdp',
        items: [
          { value: 'gdp', label: 'PIB' },
          { value: 'income', label: 'Renda média' },
        ],
      },
    ],
  },
  rightSidebar: { title: 'Details' },
};

export const Example = () => {
  return (
    <GeovisWorkspace
      spec={spec}
      onSelect={({ menuId, value }) => {
        console.log(menuId, value);
      }}
    >
      <MyMapComponent />
    </GeovisWorkspace>
  );
};
```

Selection is per menu group: choosing an item only affects its own group.
Read the current selection anywhere inside the workspace with
`useGeovisWorkspace()`.

## API

### `GeovisWorkspace` props

| Prop       | Type                          | Description                          |
| ---------- | ----------------------------- | ------------------------------------ |
| `spec`     | `GeovisWorkspaceSpec`         | Describes the sidebars. Required.    |
| `children` | `React.ReactNode`             | Main content (e.g. a map).           |
| `onSelect` | `({ menuId, value }) => void` | Called when a menu item is selected. |

### `GeovisWorkspaceSpec`

| Property       | Type                               | Description                            |
| -------------- | ---------------------------------- | -------------------------------------- |
| `leftSidebar`  | `{ menus: GeovisWorkspaceMenu[] }` | Left sidebar config. Omit to hide it.  |
| `rightSidebar` | `{ title?: string }`               | Right sidebar config. Omit to hide it. |

### `GeovisWorkspaceMenu`

| Property       | Type                                 | Description                            |
| -------------- | ------------------------------------ | -------------------------------------- |
| `id`           | `string`                             | Unique group identifier.               |
| `title`        | `string`                             | Title shown above the group.           |
| `items`        | `{ value: string; label: string }[]` | Selectable items.                      |
| `defaultValue` | `string`                             | Item selected by default in the group. |
