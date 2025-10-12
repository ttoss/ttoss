# @ttoss/components

React components for the ttoss ecosystem. **ESM only** package.

## Quick Start

```shell
pnpm add @ttoss/components @ttoss/ui @emotion/react @ttoss/react-hooks
```

**📖 [View all components in Storybook](https://storybook.ttoss.dev/?path=/docs/components-accordion--docs)**

## Components Overview

All components are theme-aware and integrate seamlessly with `@ttoss/ui`.

### Accordion

Collapsible content sections. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-accordion--docs)

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

### Drawer

Slide-out panels from screen edges. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-drawer--docs)

```tsx
import { Drawer } from '@ttoss/components/Drawer';

<Drawer open={isOpen} direction="right" size="300px">
  <div>Drawer content</div>
</Drawer>;
```

### FileUploader

Drag-and-drop file upload with progress tracking. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-fileuploader--docs)

```tsx
import { FileUploader } from '@ttoss/components/FileUploader';

<FileUploader
  onUpload={async (file) => ({ url: 'file-url', id: 'file-id' })}
  onUploadComplete={(file, result) => console.log('Uploaded:', result)}
/>;
```

### InstallPwa

PWA installation prompt component. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-installpwa--docs)

```tsx
import { InstallPwa } from '@ttoss/components/InstallPwa';

<InstallPwa />;
```

### JsonEditor

JSON editor component. Re-exports from [json-edit-react](https://carlosdevpereira.github.io/json-edit-react/). [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-jsoneditor--docs)

```tsx
import { JsonEditor } from '@ttoss/components/JsonEditor';

<JsonEditor data={jsonData} setData={setJsonData} />;
```

### JsonView

JSON viewer component. Re-exports from [react-json-view-lite](https://github.com/AnyRoad/react-json-view-lite). [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-jsonview--docs)

```tsx
import { JsonView } from '@ttoss/components/JsonView';

<JsonView data={jsonData} />;
```

### List

Unordered lists with customizable items. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-list--docs)

```tsx
import { List, ListItem } from '@ttoss/components/List';

<List>
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
</List>;
```

### Markdown

Render markdown content with theme integration. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-markdown--docs)

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

Dropdown menus with customizable triggers. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-menu--docs)

```tsx
import { Menu } from '@ttoss/components/Menu';

<Menu trigger={<Button>Open Menu</Button>}>
  <Menu.Item onClick={() => {}}>Action 1</Menu.Item>
  <Menu.Item onClick={() => {}}>Action 2</Menu.Item>
</Menu>;
```

### Modal

Theme-aware modals with accessibility features. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-modal--docs)

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

Display notification messages with actions. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-notificationcard--docs)

```tsx
import { NotificationCard } from '@ttoss/components/NotificationCard';

<NotificationCard
  title="Notification Title"
  message="Notification message"
  onClose={() => {}}
/>;
```

### NotificationsMenu

Menu component for displaying notifications. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-notificationsmenu--docs)

```tsx
import { NotificationsMenu } from '@ttoss/components/NotificationsMenu';

<NotificationsMenu
  notifications={[{ id: '1', title: 'New message', read: false }]}
  onNotificationClick={(notification) => {}}
/>;
```

### Search

Debounced search input with loading states. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-search--docs)

```tsx
import { Search } from '@ttoss/components/Search';

<Search
  value={searchText}
  onChange={setSearchText}
  loading={isLoading}
  debounce={300}
/>;
```

### Table

Flexible tables with sorting and pagination. Uses [TanStack Table](https://tanstack.com/table/latest). [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-table--docs)

```tsx
import {
  Table,
  useReactTable,
  createColumnHelper,
} from '@ttoss/components/Table';

const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
];

const table = useReactTable({
  data,
  columns,
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

Tab navigation with content panels. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-tabs--docs)

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

Toast notification system. [📖 Docs](https://storybook.ttoss.dev/?path=/docs/components-toast--docs)

```tsx
import { Toast } from '@ttoss/components/Toast';

<Toast
  message="Success message"
  type="success"
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>;
```

```

```
