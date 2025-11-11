# @ttoss/react-icons

Access 200,000+ open source icons through [Iconify](https://iconify.design/) with seamless [@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui) integration.

## Installation

```shell
pnpm add @ttoss/react-icons
```

## Quick Start

```tsx
import { Icon } from '@ttoss/react-icons';

// Basic usage
<Icon icon="mdi:home" width={24} />

// With theme colors
<Box sx={{ color: 'primary' }}>
  <Icon icon="heroicons:heart-solid" width={32} />
</Box>
```

## Finding Icons

Browse and search [200,000+ icons](https://icon-sets.iconify.design/) from popular sets:

- **Material Design**: `mdi:home`, `mdi:user`
- **Heroicons**: `heroicons:heart-solid`
- **Tabler**: `tabler:settings`
- **Feather**: `feather:search`
- **Bootstrap**: `bi:github`
- **Font Awesome**: `fa-solid:arrow-right`

## Custom Icons

Add your own SVG icons using `addIcon`:

```tsx
import { addIcon, Icon } from '@ttoss/react-icons';

// Register once (e.g., in app initialization)
addIcon('company-logo', {
  body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  width: 24,
  height: 24,
});

// Use anywhere
<Icon icon="company-logo" width={32} />;
```

## API

### Icon Props

```tsx
interface IconProps {
  icon: string; // Icon name (e.g., "mdi:home")
  width?: number | string; // Size (default: 1em)
  height?: number | string; // Height (defaults to width)
  color?: string; // Override color
  rotate?: number; // Rotation degrees
  flip?: 'horizontal' | 'vertical';
}
```

### IconType

```tsx
interface IconType {
  body: string; // SVG content (without <svg> wrapper)
  width?: number; // Default width
  height?: number; // Default height
  viewBox?: string; // SVG viewBox
}
```

## Theme Integration

Icons inherit color from parent theme context:

```tsx
// Inherits primary color
<Box sx={{ color: 'primary' }}>
  <Icon icon="mdi:star" width={24} />
</Box>

// Inherits error color
<Text sx={{ color: 'error' }}>
  <Icon icon="mdi:alert" width={16} />
  Error message
</Text>
```

Responsive sizing:

```tsx
<Icon icon="mdi:menu" width={[16, 20, 24]} />
```

## Performance

- **On-demand loading**: Only requested icons are bundled
- **SVG rendering**: Direct SVG for optimal performance
- **No network requests**: Icons embedded in bundle
- **Tree-shakeable**: Unused icons eliminated automatically

## TypeScript

Full type safety with `IconType` for custom icons and all props:

```tsx
import type { IconType, IconProps } from '@ttoss/react-icons';

const myIcon: IconType = {
  body: '<path d="..." />',
  width: 24,
  height: 24,
};
```

## Resources

- [Iconify Icon Sets](https://icon-sets.iconify.design/) - Search all available icons
- [Iconify React Documentation](https://docs.iconify.design/icon-components/react/) - Advanced usage
- [Storybook Examples](https://storybook.ttoss.dev/?path=/docs/react-icons-icon--docs) - Interactive demos
