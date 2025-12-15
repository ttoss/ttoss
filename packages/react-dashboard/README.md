# @ttoss/react-dashboard

## About

A comprehensive React dashboard module that provides fully customizable dashboard functionality with filters, templates, and responsive grid layouts. This module enables you to create data-rich dashboards with support for multiple card types, filter systems, and template management.

## Installation

```shell
pnpm add @ttoss/react-dashboard
```

## Getting Started

### Provider Setup

If you're using the `Dashboard` component directly, you don't need to set up the provider separately as it wraps the `DashboardProvider` internally. However, if you need to use the `useDashboard` hook in other components, you can wrap your application with the `DashboardProvider`:

```tsx
import { DashboardProvider } from '@ttoss/react-dashboard';
import { ThemeProvider } from '@ttoss/ui';
import type {
  DashboardTemplate,
  DashboardFilter,
} from '@ttoss/react-dashboard';

const templates: DashboardTemplate[] = [];
const filters: DashboardFilter[] = [];

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <DashboardProvider filters={filters} templates={templates}>
        <App />
      </DashboardProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Basic Dashboard Usage

```tsx
import { Dashboard } from '@ttoss/react-dashboard';
import type {
  DashboardTemplate,
  DashboardFilter,
} from '@ttoss/react-dashboard';
import { DashboardFilterType } from '@ttoss/react-dashboard';

const MyDashboard = () => {
  const templates: DashboardTemplate[] = [
    {
      id: 'default',
      name: 'Default Template',
      description: 'My default dashboard layout',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          card: {
            title: 'Total Revenue',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 150000 },
            },
          },
        },
      ],
    },
  ];

  const filters: DashboardFilter[] = [
    {
      key: 'date-range',
      type: DashboardFilterType.DATE_RANGE,
      label: 'Date Range',
      value: { from: new Date(), to: new Date() },
    },
  ];

  return <Dashboard templates={templates} filters={filters} loading={false} />;
};
```

## Components

### Dashboard

The main dashboard component that orchestrates the entire dashboard experience.

```tsx
import { Dashboard } from '@ttoss/react-dashboard';

<Dashboard
  templates={templates}
  filters={filters}
  loading={false}
  headerChildren={<CustomHeaderContent />}
  onFiltersChange={(filters) => {
    // Handle filter changes
  }}
/>;
```

**Props:**

| Prop              | Type                                   | Default | Description                                |
| ----------------- | -------------------------------------- | ------- | ------------------------------------------ |
| `templates`       | `DashboardTemplate[]`                  | `[]`    | Array of dashboard templates               |
| `filters`         | `DashboardFilter[]`                    | `[]`    | Array of dashboard filters                 |
| `loading`         | `boolean`                              | `false` | Loading state for the dashboard            |
| `headerChildren`  | `React.ReactNode`                      | -       | Additional content to render in the header |
| `onFiltersChange` | `(filters: DashboardFilter[]) => void` | -       | Callback when filters change               |

### DashboardProvider

Context provider that manages dashboard state (filters and templates).

```tsx
import { DashboardProvider } from '@ttoss/react-dashboard';

<DashboardProvider
  filters={filters}
  templates={templates}
  onFiltersChange={handleFiltersChange}
>
  {children}
</DashboardProvider>;
```

**Props:**

| Prop              | Type                                   | Default | Description                  |
| ----------------- | -------------------------------------- | ------- | ---------------------------- |
| `children`        | `React.ReactNode`                      | -       | Child components             |
| `filters`         | `DashboardFilter[]`                    | `[]`    | Filter state                 |
| `templates`       | `DashboardTemplate[]`                  | `[]`    | Template state               |
| `onFiltersChange` | `(filters: DashboardFilter[]) => void` | -       | Callback when filters change |

### useDashboard Hook

Hook to access and modify dashboard state.

```tsx
import { useDashboard } from '@ttoss/react-dashboard';

const MyComponent = () => {
  const { filters, updateFilter, templates, selectedTemplate } = useDashboard();

  // Use dashboard state
  const handleFilterChange = (key: string, value: DashboardFilterValue) => {
    updateFilter(key, value);
  };
};
```

**Returns:**

| Property           | Type                                                 | Description                                  |
| ------------------ | ---------------------------------------------------- | -------------------------------------------- |
| `filters`          | `DashboardFilter[]`                                  | Current filter state                         |
| `updateFilter`     | `(key: string, value: DashboardFilterValue) => void` | Function to update a specific filter by key  |
| `templates`        | `DashboardTemplate[]`                                | Current template state                       |
| `selectedTemplate` | `DashboardTemplate \| undefined`                     | Currently selected template based on filters |

### DashboardCard

Component for rendering individual dashboard cards. Currently supports `bigNumber` type.

```tsx
import { DashboardCard } from '@ttoss/react-dashboard';

<DashboardCard
  title="Total Revenue"
  description="Revenue from all sources"
  numberType="currency"
  type="bigNumber"
  sourceType={[{ source: 'api' }]}
  data={{
    api: { total: 150000 },
  }}
  trend={{
    value: 15.5,
    status: 'positive',
  }}
/>;
```

**Props:**

| Prop             | Type                      | Default | Description                                                                               |
| ---------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `title`          | `string`                  | -       | Card title                                                                                |
| `description`    | `string`                  | -       | Optional card description                                                                 |
| `icon`           | `string`                  | -       | Optional icon name                                                                        |
| `color`          | `string`                  | -       | Optional color for the card                                                               |
| `variant`        | `CardVariant`             | -       | Card variant (`'default' \| 'dark' \| 'light-green'`)                                     |
| `numberType`     | `CardNumberType`          | -       | Number formatting type (`'number' \| 'percentage' \| 'currency'`)                         |
| `type`           | `DashboardCardType`       | -       | Card type (`'bigNumber' \| 'pieChart' \| 'barChart' \| 'lineChart' \| 'table' \| 'list'`) |
| `sourceType`     | `CardSourceType[]`        | -       | Data source configuration                                                                 |
| `labels`         | `Array<string \| number>` | -       | Optional labels for the card                                                              |
| `data`           | `DashboardCardData`       | -       | Card data from various sources                                                            |
| `trend`          | `TrendIndicator`          | -       | Optional trend indicator                                                                  |
| `additionalInfo` | `string`                  | -       | Optional additional information text                                                      |
| `status`         | `StatusIndicator`         | -       | Optional status indicator                                                                 |

### DashboardFilters

Component that automatically renders filters based on the dashboard state.

```tsx
import { DashboardFilters } from '@ttoss/react-dashboard';

// Automatically renders filters from DashboardProvider context
<DashboardFilters />;
```

This component reads filters from the `DashboardProvider` context and renders the appropriate filter component for each filter type.

### DashboardHeader

Header component that displays filters and optional custom content.

```tsx
import { DashboardHeader } from '@ttoss/react-dashboard';

<DashboardHeader>
  <CustomActionButtons />
</DashboardHeader>;
```

**Props:**

| Prop       | Type              | Description                          |
| ---------- | ----------------- | ------------------------------------ |
| `children` | `React.ReactNode` | Optional content to render in header |

### DashboardGrid

Responsive grid layout component that displays dashboard cards using `react-grid-layout`.

```tsx
import { DashboardGrid } from '@ttoss/react-dashboard';

<DashboardGrid loading={false} />;
```

**Props:**

| Prop      | Type      | Default | Description                   |
| --------- | --------- | ------- | ----------------------------- |
| `loading` | `boolean` | -       | Shows loading spinner if true |

## Filter Types

### Text Filter

A text input filter for string values.

```tsx
import { DashboardFilterType } from '@ttoss/react-dashboard';

const textFilter: DashboardFilter = {
  key: 'search',
  type: DashboardFilterType.TEXT,
  label: 'Search',
  placeholder: 'Enter search term...',
  value: '',
  onChange: (value) => {
    console.log('Search:', value);
  },
};
```

### Select Filter

A dropdown select filter for predefined options.

```tsx
const selectFilter: DashboardFilter = {
  key: 'status',
  type: DashboardFilterType.SELECT,
  label: 'Status',
  value: 'active',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  onChange: (value) => {
    console.log('Status:', value);
  },
};
```

### Date Range Filter

A date range picker with optional presets.

```tsx
const dateRangeFilter: DashboardFilter = {
  key: 'date-range',
  type: DashboardFilterType.DATE_RANGE,
  label: 'Date Range',
  value: { from: new Date(), to: new Date() },
  presets: [
    {
      label: 'Last 7 days',
      getValue: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
  ],
  onChange: (value) => {
    console.log('Date range:', value);
  },
};
```

## Types

### DashboardTemplate

```tsx
interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  grid: DashboardGridItem[];
}
```

### DashboardGridItem

```tsx
interface DashboardGridItem extends ReactGridLayout.Layout {
  card: DashboardCard;
}
```

### DashboardFilter

```tsx
interface DashboardFilter {
  key: string;
  type: DashboardFilterType;
  label: string;
  placeholder?: string;
  value: DashboardFilterValue;
  onChange?: (value: DashboardFilterValue) => void;
  options?: { label: string; value: string | number | boolean }[];
  presets?: { label: string; getValue: () => DateRange }[];
}
```

### DashboardFilterValue

```tsx
type DashboardFilterValue =
  | string
  | number
  | boolean
  | { from: Date; to: Date };
```

### DashboardFilterType

```tsx
enum DashboardFilterType {
  TEXT = 'text',
  SELECT = 'select',
  DATE_RANGE = 'date-range',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}
```

### DashboardCard

See [DashboardCard](#dashboardcard) section for full interface.

### CardNumberType

```tsx
type CardNumberType = 'number' | 'percentage' | 'currency';
```

### CardSourceType

```tsx
type CardSourceType = {
  source: 'meta' | 'oneclickads' | 'api';
  level?: 'adAccount' | 'campaign' | 'adSet' | 'ad';
};
```

### DashboardCardType

```tsx
type DashboardCardType =
  | 'bigNumber'
  | 'pieChart'
  | 'barChart'
  | 'lineChart'
  | 'table'
  | 'list';
```

### CardVariant

```tsx
type CardVariant = 'default' | 'dark' | 'light-green';
```

## Complete Example

```tsx
import { Dashboard } from '@ttoss/react-dashboard';
import type {
  DashboardTemplate,
  DashboardFilter,
} from '@ttoss/react-dashboard';
import { DashboardFilterType } from '@ttoss/react-dashboard';

const App = () => {
  const templates: DashboardTemplate[] = [
    {
      id: 'default',
      name: 'Default Dashboard',
      grid: [
        {
          i: 'revenue',
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          card: {
            title: 'Total Revenue',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 150000 },
            },
            trend: {
              value: 15.5,
              status: 'positive',
            },
          },
        },
        {
          i: 'roas',
          x: 4,
          y: 0,
          w: 4,
          h: 4,
          card: {
            title: 'ROAS',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {
              api: { total: 3.5 },
            },
            variant: 'light-green',
          },
        },
      ],
    },
  ];

  const filters: DashboardFilter[] = [
    {
      key: 'template',
      type: DashboardFilterType.SELECT,
      label: 'Template',
      value: 'default',
      options: [{ label: 'Default Dashboard', value: 'default' }],
    },
    {
      key: 'date-range',
      type: DashboardFilterType.DATE_RANGE,
      label: 'Date Range',
      value: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
      presets: [
        {
          label: 'Last 7 days',
          getValue: () => ({
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date(),
          }),
        },
        {
          label: 'Last 30 days',
          getValue: () => ({
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          }),
        },
      ],
    },
  ];

  const handleFiltersChange = (updatedFilters: DashboardFilter[]) => {
    console.log('Filters changed:', updatedFilters);
    // Update your data fetching logic here
  };

  return (
    <Dashboard
      templates={templates}
      filters={filters}
      loading={false}
      onFiltersChange={handleFiltersChange}
    />
  );
};
```

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
