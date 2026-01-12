# @ttoss/components

React components for the ttoss ecosystem. **ESM only** package.

## Quick Start

```shell
pnpm add @ttoss/components @ttoss/ui @emotion/react @ttoss/react-hooks
```

[View all components in Storybook](https://storybook.ttoss.dev/?path=/docs/components-accordion--docs)

## Components

All components are theme-aware and integrate seamlessly with `@ttoss/ui`.

### Accordion

Collapsible content sections. [Docs](https://storybook.ttoss.dev/?path=/docs/components-accordion--docs)

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from '@ttoss/components/Accordion';

<Accordion allowMultipleExpanded>
  <AccordionItem>
    <AccordionItemHeading>
      <AccordionItemButton>Section Title</AccordionItemButton>
    </AccordionItemHeading>
    <AccordionItemPanel>Section content</AccordionItemPanel>
  </AccordionItem>
</Accordion>;
```

### DatePicker

Date range picker with presets and mobile support. [Docs](https://storybook.ttoss.dev/?path=/docs/components-datepicker--docs)

```tsx
import { DatePicker } from '@ttoss/components/DatePicker';

<DatePicker
  label="Select period"
  value={dateRange}
  onChange={setDateRange}
  presets={[
    {
      label: 'Last 7 days',
      getValue: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
  ]}
/>;
```

### Drawer

Slide-out panels from screen edges. [Docs](https://storybook.ttoss.dev/?path=/docs/components-drawer--docs)

```tsx
import { Drawer } from '@ttoss/components/Drawer';

<Drawer open={isOpen} direction="right" size="300px">
  <div>Drawer content</div>
</Drawer>;
```

### EnhancedTitle

Structured title section with icon, badges, and metadata. [Docs](https://storybook.ttoss.dev/?path=/docs/components-enhancedtitle--docs)

```tsx
import { EnhancedTitle } from '@ttoss/components/EnhancedTitle';

<EnhancedTitle
  icon="fluent:shield-24-filled"
  title="Starter Plan"
  frontTitle="$49.90/mo"
  description="Perfect for small teams"
  variant="primary"
  topBadges={[
    {
      label: 'Active',
      variant: 'positive',
      icon: 'fluent:checkmark-circle-24-filled',
    },
  ]}
  bottomBadges={[
    { label: 'OneClick Tracking', icon: 'fluent:checkmark-24-filled' },
  ]}
/>;
```

### FileUploader

Controlled file uploader with drag-and-drop, previews, and validation. [Docs](https://storybook.ttoss.dev/?path=/docs/components-fileuploader--docs)

```tsx
import { FileUploader } from '@ttoss/components/FileUploader';

<FileUploader
  onUpload={async (file, onProgress) => {
    const result = await uploadToServer(file);
    return { url: result.url, id: result.id, name: result.name };
  }}
  files={files}
  onUploadComplete={(file, result) => setFiles([...files, result])}
  onRemove={(file, index) => setFiles(files.filter((_, i) => i !== index))}
  accept="image/*,.pdf"
  maxSize={10 * 1024 * 1024}
  maxFiles={5}
/>;
```

### InstallPwa

PWA installation prompt component.

```tsx
import { InstallPwa } from '@ttoss/components/InstallPwa';

<InstallPwa />;
```

### JsonEditor

JSON editor component. Re-exports from [json-edit-react](https://carlosdevpereira.github.io/json-edit-react/). [Docs](https://storybook.ttoss.dev/?path=/docs/components-jsoneditor--docs)

```tsx
import { JsonEditor } from '@ttoss/components/JsonEditor';

<JsonEditor data={jsonData} setData={setJsonData} />;
```

### JsonView

JSON viewer component. Re-exports from [react-json-view-lite](https://github.com/AnyRoad/react-json-view-lite).

```tsx
import { JsonView } from '@ttoss/components/JsonView';

<JsonView data={jsonData} />;
```

### List

Unordered lists with customizable items. [Docs](https://storybook.ttoss.dev/?path=/docs/components-list--docs)

```tsx
import { List, ListItem } from '@ttoss/components/List';

<List>
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
</List>;
```

### LockedOverlay

Block and display locked features or restricted content within a container. Unlike modals, overlays block only their parent container. [Docs](https://storybook.ttoss.dev/?path=/docs/components-lockedoverlay--docs)

```tsx
import { LockedOverlay } from '@ttoss/components/LockedOverlay';

<Box sx={{ position: 'relative' }}>
  <LockedOverlay
    isOpen={isOpen}
    onRequestClose={() => setIsOpen(false)}
    header={{
      icon: 'fluent:lock-closed-24-filled',
      title: 'Premium Feature',
      description: 'Available in Pro plan only',
      variant: 'primary',
    }}
    actions={[
      {
        label: 'Upgrade Now',
        icon: 'fluent-emoji-high-contrast:sparkles',
        variant: 'primary',
        onClick: handleUpgrade,
      },
    ]}
  >
    <Text>This feature is only available for Pro users.</Text>
  </LockedOverlay>
</Box>;
```

### Markdown

Render markdown content with theme integration. [Docs](https://storybook.ttoss.dev/?path=/docs/components-markdown--docs)

```tsx
import { Markdown } from '@ttoss/components/Markdown';

<Markdown
  components={{
    a: ({ children, ...props }) => <Link {...props}>{children}</Link>,
  }}
>
  # Heading Some **bold** text
</Markdown>;
```

### Menu

Dropdown menus with customizable triggers. [Docs](https://storybook.ttoss.dev/?path=/docs/components-menu--docs)

```tsx
import { Menu } from '@ttoss/components/Menu';

<Menu trigger={<Button>Open Menu</Button>}>
  <Menu.Item onClick={() => {}}>Action 1</Menu.Item>
  <Menu.Item onClick={() => {}}>Action 2</Menu.Item>
</Menu>;
```

### MetricCard

Display metrics with progress visualization, status indicators, and contextual information. [Docs](https://storybook.ttoss.dev/?path=/docs/components-metriccard--docs)

```tsx
import { MetricCard } from '@ttoss/components/MetricCard';

<MetricCard
  metric={{
    type: 'number',
    value: 8,
    max: 10,
    label: 'Active Users',
    icon: 'mdi:account-group',
  }}
/>;
```

### NavList

Navigation lists for sidebars, menus, and dropdowns with icons, grouping, and routing integration. [Docs](https://storybook.ttoss.dev/?path=/docs/components-navlist--docs)

```tsx
import { NavList } from '@ttoss/components/NavList';

<NavList
  items={[
    { id: '1', label: 'Home', href: '/', icon: 'mdi:home' },
    { id: '2', label: 'Profile', href: '/profile', icon: 'mdi:account' },
  ]}
  variant="sidebar"
  LinkComponent={NextLink}
/>;
```

### Modal

Theme-aware modals with accessibility features. [Docs](https://storybook.ttoss.dev/?path=/docs/components-modal--docs)

```tsx
import { Modal } from '@ttoss/components/Modal';

<Modal
  isOpen={isOpen}
  onRequestClose={() => setIsOpen(false)}
  style={{ content: { backgroundColor: 'secondary' } }}
>
  Modal content
</Modal>;
```

### NotificationCard

Display notification messages with actions. [Docs](https://storybook.ttoss.dev/?path=/docs/components-notificationcard--docs)

```tsx
import { NotificationCard } from '@ttoss/components/NotificationCard';

<NotificationCard
  title="Notification Title"
  message="Notification message"
  onClose={() => {}}
/>;
```

### NotificationsMenu

Menu component for displaying notifications. [Docs](https://storybook.ttoss.dev/?path=/docs/components-notificationsmenu--docs)

```tsx
import { NotificationsMenu } from '@ttoss/components/NotificationsMenu';

<NotificationsMenu
  notifications={[{ id: '1', title: 'New message', read: false }]}
  onNotificationClick={(notification) => {}}
/>;
```

### Search

Debounced search input with loading states. [Docs](https://storybook.ttoss.dev/?path=/docs/components-search--docs)

```tsx
import { Search } from '@ttoss/components/Search';

<Search
  value={searchText}
  onChange={setSearchText}
  loading={isLoading}
  debounce={300}
/>;
```

### SpotlightCard

Interactive card with spotlight effect, icon, and action buttons. [Docs](https://storybook.ttoss.dev/?path=/docs/components-spotlightcard--docs)

```tsx
import { SpotlightCard } from '@ttoss/components/SpotlightCard';

<SpotlightCard
  icon="mdi:rocket-launch"
  title="Launch Product"
  description="Deploy your product to production"
  primaryButton={{ label: 'Deploy', onClick: handleDeploy }}
  secondaryButton={{ label: 'Preview', onClick: handlePreview }}
/>;
```

### Table

Flexible tables with sorting and pagination. Uses [TanStack Table](https://tanstack.com/table/latest). [Docs](https://storybook.ttoss.dev/?path=/docs/components-table--docs)

```tsx
import {
  Table,
  useReactTable,
  createColumnHelper,
} from '@ttoss/components/Table';

const table = useReactTable({
  data,
  columns: [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
  ],
  getCoreRowModel: getCoreRowModel(),
});

<Table>
  <Table.Head>
    {table.getHeaderGroups().map((headerGroup) => (
      <Table.Row key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <Table.Header key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </Table.Header>
        ))}
      </Table.Row>
    ))}
  </Table.Head>
  <Table.Body>
    {table.getRowModel().rows.map((row) => (
      <Table.Row key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <Table.Cell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </Table.Cell>
        ))}
      </Table.Row>
    ))}
  </Table.Body>
</Table>;
```

### Tabs

Tab navigation with content panels. [Docs](https://storybook.ttoss.dev/?path=/docs/components-tabs--docs)

```tsx
import { Tabs } from '@ttoss/components/Tabs';

<Tabs>
  <Tabs.TabList>
    <Tabs.Tab>Tab 1</Tabs.Tab>
    <Tabs.Tab>Tab 2</Tabs.Tab>
  </Tabs.TabList>
  <Tabs.TabContent>
    <Tabs.TabPanel>Content 1</Tabs.TabPanel>
    <Tabs.TabPanel>Content 2</Tabs.TabPanel>
  </Tabs.TabContent>
</Tabs>;
```

### Toast

Toast notification system. [Docs](https://storybook.ttoss.dev/?path=/docs/components-toast--docs)

```tsx
import { Toast } from '@ttoss/components/Toast';

<Toast
  message="Success message"
  type="success"
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>;
```
