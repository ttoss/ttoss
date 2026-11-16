import '@ttoss/react-openapi/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  type JsonObject,
  OpenApiProvider,
  OpenApiTable,
} from '@ttoss/react-openapi';
import * as React from 'react';

import { createFakeApi } from './fakeApi';
import { spec } from './fixtures';

// ─── Stories ─────────────────────────────────────────────────────────────────

const Frame = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 24,
        maxWidth: 1100,
      }}
    >
      {children}
    </div>
  );
};

const meta: Meta<typeof OpenApiTable> = {
  title: 'React OpenAPI/OpenApiTable',
  component: OpenApiTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A data table rendered from an OpenAPI list operation. Give it an `operationId`; it calls the API through the `OpenApiProvider` fetcher, derives columns and cell formatting from the response schema, and adds search, status filters, sorting and pagination. These stories run against an in-memory fake API passed as the `fetcher`.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OpenApiTable>;

export const Default: Story = {
  args: { operationId: 'listClients' },
  render: (args) => {
    const fetcher = React.useMemo(() => {
      return createFakeApi();
    }, []);
    return (
      <Frame>
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          <OpenApiTable {...args} />
        </OpenApiProvider>
      </Frame>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '`listClients` returns a plain array and declares no query params, so everything happens in the browser. Columns come from the `Client` schema in declaration order (scalars first): the `status` enum renders as tonal badges and filter chips, `balance` as a locale number, `vip` as Yes/No, `created_at` as a localized date. `api_key` is left out as sensitive.',
      },
    },
  },
};

export const ServerPagination: Story = {
  args: { operationId: 'listOrders', pageSize: 15 },
  render: Default.render,
  parameters: {
    docs: {
      description: {
        story:
          '`listOrders` declares `limit`, `offset`, `q` and `status` query params and returns `{ data, total }` (an `allOf` over a `Page` schema). The table sends paging, search (debounced) and the status filter to the server, and reads the total for the page count.',
      },
    },
  },
};

export const CustomColumns: Story = {
  args: { operationId: 'listClients' },
  render: (args) => {
    const fetcher = React.useMemo(() => {
      return createFakeApi();
    }, []);
    const [selected, setSelected] = React.useState<JsonObject | null>(null);
    return (
      <Frame>
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          <OpenApiTable
            {...args}
            pageSize={8}
            columns={[
              {
                key: 'name',
                header: 'Client',
                render: ({ item }) => {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{String(item.name)}</strong>
                      <span style={{ color: '#737373', fontSize: 12 }}>
                        {String(item.email)}
                      </span>
                    </div>
                  );
                },
              },
              'status',
              {
                key: 'address',
                header: 'City',
                render: ({ value }) => {
                  return String((value as JsonObject | null)?.city ?? '—');
                },
              },
              'balance',
            ]}
            onRowClick={setSelected}
            actions={
              <button
                type="button"
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#171717',
                  color: '#fafafa',
                  cursor: 'pointer',
                }}
              >
                {'New client'}
              </button>
            }
          />
        </OpenApiProvider>
        <p style={{ fontSize: 14, color: '#737373' }}>
          {selected
            ? `Clicked: ${String(selected.name)} (${String(selected.id)})`
            : 'Click a row.'}
        </p>
      </Frame>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Columns chosen and ordered by the caller. A string keeps the schema-driven header and formatting; an object can override `header` and `render`. `onRowClick` makes rows clickable (and keyboard-focusable), and `actions` adds content to the toolbar.',
      },
    },
  },
};

export const SpecFromUrl: Story = {
  args: { operationId: 'listOrders' },
  render: (args) => {
    const fetcher = React.useMemo(() => {
      return createFakeApi({ latency: 900 });
    }, []);
    return (
      <Frame>
        <OpenApiProvider specUrl="/api/v1/openapi.json" fetcher={fetcher}>
          <OpenApiTable {...args} />
        </OpenApiProvider>
      </Frame>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `specUrl`, the provider fetches the spec through the same fetcher (so it shares base URL and auth). The table shows its loading state until both the spec and the data arrive.',
      },
    },
  },
};

export const Empty: Story = {
  args: { operationId: 'listClients' },
  render: (args) => {
    const fetcher = React.useMemo(() => {
      return createFakeApi({ emptyClients: true });
    }, []);
    return (
      <Frame>
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          <OpenApiTable {...args} />
        </OpenApiProvider>
      </Frame>
    );
  },
};

export const RequestError: Story = {
  args: { operationId: 'listFailing' },
  render: Default.render,
  parameters: {
    docs: {
      description: {
        story:
          'When the fetcher rejects, the table shows the error message and a retry button.',
      },
    },
  },
};
