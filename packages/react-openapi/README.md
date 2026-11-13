# @ttoss/react-openapi

Render React UI straight from an OpenAPI spec. Each component takes the `operationId` of an operation, calls the API and derives what it shows from the operation's schemas:

- `OpenApiTable` — a list operation as a table with search, status filters, sorting and pagination.
- `OpenApiDetail` — a GET of one record as a labelled, formatted read-only view.
- `OpenApiForm` — any operation with a request body as a form, with validation; PUT/PATCH pre-fill from the GET on the same path.
- `OpenApiDeleteButton` — a DELETE behind a confirmation dialog.

Composed, they make a full admin for a resource; the app only wires navigation between them. `useOperationQuery` and `useOperationMutation` expose the same calls for custom UI.

## Installation

```bash
pnpm add @ttoss/react-openapi @ttoss/react-i18n
```

## Usage

```tsx
import '@ttoss/react-openapi/styles.css';

import {
  createFetcher,
  OpenApiProvider,
  OpenApiTable,
} from '@ttoss/react-openapi';

const fetcher = createFetcher({
  baseUrl: 'https://api.example.com',
  headers: () => ({ Authorization: `Bearer ${getToken()}` }),
});

export const App = () => {
  return (
    <OpenApiProvider specUrl="/api/v1/openapi.json" fetcher={fetcher}>
      <OpenApiTable operationId="listClients" />
    </OpenApiProvider>
  );
};
```

`OpenApiProvider` takes the spec inline (`spec`) or fetches it (`specUrl`). Every request goes through `fetcher`, so base URL, auth and error handling stay in the app; `createFetcher` covers the common `fetch` case.

## What the table derives from the spec

| From the spec                                                                                  | Becomes                                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Response schema (`array`, or a wrapper like `{ data: [...], total }`, `$ref`/`allOf` resolved) | Columns, in declaration order, scalars first, up to `maxColumns` (6) |
| `format: date` / `date-time`, `number`, `boolean`                                              | Locale-formatted dates and numbers, Yes/No                           |
| `status`/`state` field with an `enum`                                                          | Tonal badges and filter chips                                        |
| Field named like `secret`, `token`, `api_key`, or `x-sensitive: true`                          | Hidden from derived columns and masked in cells                      |
| `limit` + `offset` (or `page` + size) query params                                             | Server-side pagination; otherwise paginates in the browser           |
| `q` / `search` / `query` query param                                                           | Server-side search (debounced); otherwise filters loaded rows        |
| `status` query param                                                                           | Server-side status filter                                            |

Sorting by column header is available when the table paginates in the browser.

## Customizing columns

```tsx
<OpenApiTable
  operationId="listClients"
  columns={[
    'name', // default header and formatting
    'status',
    { key: 'balance', header: 'Balance (BRL)' },
    { key: 'address', header: 'City', render: ({ value }) => value?.city },
  ]}
  onRowClick={(client) => navigate(`/clients/${client.id}`)}
  actions={<Button>New client</Button>}
/>
```

## Detail

```tsx
<OpenApiDetail
  operationId="getClient"
  params={{ client_id: id }}
  actions={({ record }) => (
    <OpenApiDeleteButton
      operationId="deleteClient"
      params={{ client_id: id }}
      recordName={String(record.name)}
      onSuccess={() => navigate('/clients')}
    />
  )}
/>
```

Fields follow the response schema (`writeOnly` ones are skipped). Lists of scalars render as badges, flat objects as key/value pairs, nested objects as JSON, and sensitive fields are masked behind a "Show" toggle. `fields` chooses, orders, relabels or custom-renders them.

## Forms

```tsx
<OpenApiForm operationId="createClient" onSuccess={(client) => navigate(`/clients/${client.id}`)} />
<OpenApiForm operationId="updateClient" params={{ client_id: id }} onCancel={goBack} />
```

| Field schema                                                                                | Control                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `string` (`format: email`, `uri`, `password`, `date`, `date-time`)                          | Text input of the matching type                        |
| `string` with `maxLength` > 255, a name like `description`/`notes`, or `x-widget: textarea` | Textarea                                               |
| `integer` / `number`                                                                        | Number input                                           |
| `boolean`                                                                                   | Checkbox                                               |
| `enum`                                                                                      | Select                                                 |
| `array` of `enum`                                                                           | Checkbox group                                         |
| `format: binary`                                                                            | File input (the body is sent as `multipart/form-data`) |
| `object` / other `array`                                                                    | JSON textarea                                          |

`readOnly` fields are left out. Validation follows `required`, `minimum`/`maximum`, `minLength`/`maxLength` and `pattern`; field errors the API returns as `{ errors: [{ field, message }] }` or `{ errors: { field: message } }` are shown on the field. A PATCH sends only the fields that changed. `fields` chooses, orders and relabels fields, and `render` replaces a control.

## Styling

Components are styled with Tailwind; `styles.css` ships the compiled utilities. Utilities are prefixed (`oa:`), preflight is not included, and they are emitted outside cascade layers, so the stylesheet neither restyles the host app nor loses to its CSS reset. Theme the components by setting these custom properties on `:root` or any ancestor:

`--openapi-background`, `--openapi-foreground`, `--openapi-muted`, `--openapi-muted-foreground`, `--openapi-accent`, `--openapi-border`, `--openapi-input`, `--openapi-ring`, `--openapi-primary`, `--openapi-primary-foreground`, `--openapi-destructive`.

## Without React

`@ttoss/react-openapi/core` exports the spec logic (`findOperation`, `buildOperationUrl`, `resolveSchema`, `getListItemSchema`, `deriveColumns`, `detectServerPagination`, …) for use outside React.

See the [Storybook](https://storybook.ttoss.dev/) stories under _React OpenAPI_.
