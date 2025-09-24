# @ttoss/layouts

Professional layout components for React applications with responsive design and accessibility built-in.

## Installation

```shell
pnpm add @ttoss/layouts @ttoss/ui @emotion/react
```

## Available Layouts

### StackedLayout - Simple Vertical Layout

Perfect for traditional websites with header, main content, and footer.

```tsx
import { Layout, StackedLayout } from '@ttoss/layouts';

const App = () => (
  <StackedLayout>
    <Layout.Header>Navigation & Branding</Layout.Header>
    <Layout.Main>Page Content</Layout.Main>
    <Layout.Footer>Copyright & Links</Layout.Footer>
  </StackedLayout>
);
```

### SidebarCollapseLayout - Dashboard & Admin Interfaces

Responsive sidebar that collapses on mobile, perfect for dashboards and admin panels.

```tsx
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';

const Dashboard = () => (
  <SidebarCollapseLayout>
    <Layout.Header showSidebarButton>App Header with Menu Toggle</Layout.Header>
    <Layout.Sidebar>Navigation Menu</Layout.Sidebar>
    <Layout.Main.Header>Page Title & Actions</Layout.Main.Header>
    <Layout.Main>Dashboard Content</Layout.Main>
    <Layout.Main.Footer>Status Bar</Layout.Main.Footer>
  </SidebarCollapseLayout>
);
```

## Core Components

### Layout.Main Sub-Components

Enhanced main content area with optional header and footer sections.

```tsx
<Layout.Main.Header>
  <h1>Page Title</h1>
  <button>Action Button</button>
</Layout.Main.Header>

<Layout.Main>
  Main content with consistent padding and overflow handling
</Layout.Main>

<Layout.Main.Footer>
  <span>Last updated: Today</span>
</Layout.Main.Footer>
```

## Automatic Layout Composition

**Key Concept**: Layout components automatically detect and organize their child components by `displayName`, even when components are distributed across different files or routing structures.

### React Router Integration

Perfect for apps where layout components come from different routes:

```tsx
// App.tsx - Layout wrapper
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import { Outlet } from 'react-router-dom';

const AppLayout = () => (
  <SidebarCollapseLayout>
    <AppHeader />
    <AppSidebar />
    <Outlet /> {/* Routes render here */}
  </SidebarCollapseLayout>
);

// pages/Dashboard.tsx - Page-specific components
const Dashboard = () => (
  <>
    <Layout.Main.Header>
      <h1>Dashboard</h1>
    </Layout.Main.Header>
    <Layout.Main>
      <DashboardCharts />
    </Layout.Main>
    <Layout.Main.Footer>Last updated: {lastUpdate}</Layout.Main.Footer>
  </>
);
```

The layout **automatically composes** itself by finding components with matching `displayName` properties, regardless of component hierarchy or file structure.

### Component Detection System

```tsx
// These components can be anywhere in your component tree:
<Layout.Header />     // → Detected as "Header"
<Layout.Sidebar />    // → Detected as "Sidebar"
<Layout.Main />       // → Detected as "Main"
<Layout.Footer />     // → Detected as "Footer"
<Layout.Main.Header />  // → Detected as "MainHeader"
<Layout.Main.Footer />  // → Detected as "MainFooter"
```

## Component Properties

### Responsive Behavior

- **Desktop**: Sidebar remains visible, toggleable via button
- **Mobile**: Sidebar becomes slide-out drawer, auto-closes on navigation
- **Accessible**: Full keyboard navigation and screen reader support

### Styling Integration

All components integrate seamlessly with `@ttoss/ui` theme system via `sx` prop:

```tsx
<Layout.Header
  sx={{
    backgroundColor: 'brand.primary',
    borderBottom: '2px solid',
  }}
>
  Custom styled header
</Layout.Header>
```

## Advanced Usage

### Custom Components with displayName

Create reusable layout components by preserving the required `displayName`:

```tsx
const AppHeader = ({ children, ...props }) => (
  <Layout.Header {...props}>
    <Logo />
    {children}
    <UserMenu />
  </Layout.Header>
);

AppHeader.displayName = Layout.Header.displayName; // Required for layout detection
```

### Sidebar with Logo Slot

Add branding or controls to the sidebar area:

```tsx
<Layout.Header sidebarSlot={<CompanyLogo />} showSidebarButton>
  Main header content
</Layout.Header>
```

## Examples

View complete examples in [Storybook](https://storybook.ttoss.dev/?path=/story/layouts-layout).

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
