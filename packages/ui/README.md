# @ttoss/ui

React component library built on [Theme UI](https://theme-ui.com/) for building consistent, accessible user interfaces with [design token](https://ttoss.dev/docs/design/design-system/design-tokens) integration.

## Installation

```shell
pnpm add @ttoss/ui @ttoss/react-icons @emotion/react
```

**ESM Only**: This package requires ES modules support.

## Quick Start

### 1. Setup Theme Provider

```tsx
import { ThemeProvider } from '@ttoss/ui';
import { BruttalTheme } from '@ttoss/theme/Bruttal';

export const App = () => (
  <ThemeProvider theme={BruttalTheme}>
    <YourAppContent />
  </ThemeProvider>
);
```

### 2. Use Components

```tsx
import { Flex, Text, Button, Box } from '@ttoss/ui';

export const Example = () => (
  <Box sx={{ padding: 'lg' }}>
    <Text variant="heading">Welcome</Text>
    <Flex sx={{ gap: 'md', flexDirection: 'column' }}>
      <Button variant="primary">Get Started</Button>
      <Text>
        Access [design
        tokens](https://ttoss.dev/docs/design/design-system/design-tokens) via
        the `sx` prop
      </Text>
    </Flex>
  </Box>
);
```

### 3. Custom Themes (Optional)

```tsx
import type { Theme } from '@ttoss/ui';

export const customTheme: Theme = {
  colors: {
    primary: '#007acc',
    background: '#ffffff',
    text: '#000000',
  },
};
```

**Note**: No custom JSX pragma needed when using `sx` prop directly on library components.

## Available Components

**Browse all components**: [Storybook Documentation](https://storybook.ttoss.dev/?path=/story/ui)

### Layout & Structure

- `Box` - Basic container with styling capabilities
- `Flex` - Flexbox container for flexible layouts
- `Grid` - CSS Grid container for complex layouts
- `Container` - Centered container with max-width
- `Stack` - Vertical/horizontal stack layouts
- `Divider` - Visual content separators
- `Card` - Content containers with styling

### Typography

- `Text` - Text display with variants
- `Heading` - Heading elements (h1-h6)
- `Paragraph` - Paragraph text blocks
- `Link` - Styled anchor elements
- `Label` - Form labels

### Form Controls

- `Button` - Interactive buttons with variants
- `ActionButton` - Action-specific buttons
- `IconButton` - Icon-only buttons
- `CloseButton` - Close/dismiss buttons
- `Input` - Text input fields with icon support
- `InputNumber` - Numeric input fields
- `InputPassword` - Password input with reveal
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Checkbox controls
- `Radio` - Radio button controls
- `Switch` - Toggle switches
- `Slider` - Range slider controls
- `SegmentedControl` - Multi-option selector

#### Input Component Features

The `Input` component supports leading and trailing icons with tooltips:

```tsx
import { Input } from '@ttoss/ui';

// Basic input with icons
<Input
  placeholder="Search..."
  leadingIcon={{
    icon: 'search',
    onClick: () => console.log('Search clicked'),
    tooltip: 'Click to search'
  }}
  trailingIcon={{
    icon: 'info-circle',
    tooltip: 'Additional information',
    tooltipProps: { variant: 'info' }
  }}
/>

// Icons without tooltips
<Input
  placeholder="Email"
  leadingIcon={{ icon: 'mail' }}
/>
```

### Feedback & Status

- `Badge` - Status indicators and labels
- `Tag` - Tagging and categorization
- `Spinner` - Loading indicators
- `LinearProgress` - Progress bars
- `InfiniteLinearProgress` - Indeterminate progress
- `Tooltip` - Contextual help text
- `HelpText` - Form help and validation text

### Media

- `Image` - Responsive image component

### Advanced Features

#### Global Styles

Theme-aware global CSS using Emotion:

```tsx
import { Global } from '@ttoss/ui';

export const AppStyles = () => (
  <Global
    styles={{
      body: {
        margin: 0,
        fontFamily: 'body',
        backgroundColor: 'background',
      },
    }}
  />
);
```

#### Animations

```tsx
import { Box, keyframes } from '@ttoss/ui';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const AnimatedBox = () => (
  <Box sx={{ animation: `${fadeIn} 1s ease-in` }}>Animated content</Box>
);
```

#### Theme Access

```tsx
import { useTheme } from '@ttoss/ui';

export const CustomComponent = () => {
  const { theme } = useTheme();
  const primaryColor = theme.colors.primary;

  return <div style={{ color: primaryColor }}>Themed content</div>;
};
```

## Integration

- **Design System**: Part of the [ttoss Design System](https://ttoss.dev/docs/design/design-system)
- **Theme Integration**: Uses [semantic tokens](https://ttoss.dev/docs/design/design-system/design-tokens/semantic-tokens)
- **Accessibility**: Built-in WCAG compliance
- **TypeScript**: Full type safety with Theme UI integration

## Related Packages

- **[@ttoss/theme](https://ttoss.dev/docs/modules/packages/theme)**: Pre-built themes (Bruttal, Oca)
- **[@ttoss/components](https://ttoss.dev/docs/modules/packages/components)**: Higher-level composed components
- **[@ttoss/react-icons](https://ttoss.dev/docs/modules/packages/react-icons)**: Icon library integration
