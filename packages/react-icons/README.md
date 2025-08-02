# @ttoss/react-icons

React icon library built on [Iconify](https://iconify.design/) with 200,000+ open source icons. Provides seamless integration with [@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui) components and theme system.

## Installation

```shell
pnpm add @ttoss/react-icons
```

## Quick Start

### Basic Usage

```tsx
import { Icon } from '@ttoss/react-icons';

export const Example = () => (
  <Icon icon="mdi-light:alarm-panel" style={{ color: 'red' }} width={24} />
);
```

### With Theme Integration

```tsx
import { Icon } from '@ttoss/react-icons';
import { Box } from '@ttoss/ui';

export const ThemedIcon = () => (
  <Box sx={{ color: 'primary' }}>
    <Icon icon="heroicons:heart-solid" width={32} />
  </Box>
);
```

## Available Icons

Access 200,000+ icons from popular icon sets:

- **Material Design Icons**: `mdi:*` (e.g., `mdi:home`, `mdi:user`)
- **Heroicons**: `heroicons:*` (e.g., `heroicons:heart-solid`)
- **Tabler Icons**: `tabler:*` (e.g., `tabler:settings`)
- **Feather Icons**: `feather:*` (e.g., `feather:search`)
- **Bootstrap Icons**: `bi:*` (e.g., `bi:github`)
- **Font Awesome**: `fa:*`, `fa-solid:*`, `fa-brands:*`

**Browse all icons**: [Iconify Icon Sets](https://icon-sets.iconify.design/)

## API Reference

### `<Icon>` Component

```tsx
interface IconProps {
  icon: string; // Icon name (e.g., "mdi:home")
  width?: number | string; // Icon width
  height?: number | string; // Icon height
  style?: CSSProperties; // Custom CSS styles
  color?: string; // Icon color
  rotate?: number; // Rotation angle
  flip?: 'horizontal' | 'vertical'; // Flip direction
}
```

### Basic Examples

```tsx
// Different sizes
<Icon icon="mdi:home" width={16} />
<Icon icon="mdi:home" width={24} />
<Icon icon="mdi:home" width={32} />

// Colors and styling
<Icon icon="heroicons:heart-solid" style={{ color: '#ff6b6b' }} />
<Icon icon="tabler:star" color="gold" />

// Transformations
<Icon icon="mdi:arrow-right" rotate={90} />
<Icon icon="mdi:arrow-right" flip="horizontal" />
```

## Custom Icons

### Adding Custom Icons

Extend the library with your own SVG icons using `addIcon`:

```tsx
import { Icon, addIcon, type IconType } from '@ttoss/react-icons';

const customSearchIcon: IconType = {
  body: `<path d="M15.8053 15.8013L21 21M10.5 7.5V13.5M7.5 10.5H13.5M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
};

// Register custom icon
addIcon('custom-search', customSearchIcon);

// Use custom icon
export const CustomIconExample = () => <Icon icon="custom-search" width={24} />;
```

### Custom Icon Properties

```tsx
interface IconType {
  body: string; // SVG path/content (without <svg> wrapper)
  width?: number; // Default width
  height?: number; // Default height
  viewBox?: string; // SVG viewBox attribute
}
```

## Theme Integration

### Using with ttoss Design System

Icons automatically inherit colors from the theme context:

```tsx
import { Icon } from '@ttoss/react-icons';
import { Box, Text } from '@ttoss/ui';

export const ThemedIcons = () => (
  <Box sx={{ color: 'primary' }}>
    <Text sx={{ display: 'flex', alignItems: 'center', gap: 'sm' }}>
      <Icon icon="mdi:check-circle" width={20} />
      Success message
    </Text>
  </Box>
);
```

### Responsive Icon Sizes

```tsx
export const ResponsiveIcon = () => (
  <Icon
    icon="mdi:menu"
    width={[16, 20, 24]} // Responsive sizes
    style={{ color: 'currentColor' }}
  />
);
```

## Performance

### Automatic Optimization

- **Bundle optimization**: Only requested icons are included in the bundle
- **SVG rendering**: Direct SVG rendering for optimal performance
- **No external dependencies**: Icons are embedded, no network requests

### Best Practices

- Use consistent icon sizes throughout your application
- Leverage theme colors instead of hardcoded values
- Batch icon registrations for custom icons

## Integration

- **Design System**: Seamlessly integrates with [ttoss Design System](https://ttoss.dev/docs/design/design-system)
- **Theme Support**: Respects [@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui) theme colors and sizing
- **TypeScript**: Full type safety for icon names and properties
- **Accessibility**: Proper ARIA attributes and screen reader support

## Related Resources

- **[Iconify Documentation](https://docs.iconify.design/icon-components/react/)**: Complete React integration guide
- **[Icon Browser](https://icon-sets.iconify.design/)**: Search and browse available icons
- **[Storybook Examples](https://storybook.ttoss.dev)**: Interactive examples and usage patterns
