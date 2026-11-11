import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@ttoss/test-utils/react';

import { OpenApiProvider, OpenApiTable } from '../../../src';
import { spec } from '../fixtures';
import { createFakeApi } from './fakeApi';

const renderTable = (
  props: Partial<React.ComponentProps<typeof OpenApiTable>> = {},
  api = createFakeApi()
) => {
  render(
    <OpenApiProvider spec={spec} fetcher={api.fetcher}>
      <OpenApiTable operationId="listClients" {...props} />
    </OpenApiProvider>
  );
  return api;
};

const bodyRows = () => {
  return screen.getAllByRole('row').slice(1);
};

test('renders columns and rows derived from the schema', async () => {
  renderTable();
  expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
  const headers = screen.getAllByRole('columnheader').map((h) => {
    return h.textContent;
  });
  expect(headers).toEqual([
    'Id',
    'Full name',
    'Email',
    'Status',
    'Balance',
    'Vip',
  ]);
  expect(screen.queryByText('sk_live_123')).not.toBeInTheDocument();
  expect(screen.getAllByText('Yes')).toHaveLength(1);
  expect(bodyRows()).toHaveLength(3);
});

test('searches, filters by status and sorts on the client', async () => {
  const user = userEvent.setup();
  renderTable();
  await screen.findByText('Ana Silva');

  await user.type(
    screen.getByRole('searchbox', { name: 'Search records' }),
    'bruno'
  );
  expect(bodyRows()).toHaveLength(1);
  await user.clear(screen.getByRole('searchbox', { name: 'Search records' }));

  const filters = screen.getByRole('group', { name: 'Filter by Status' });
  await user.click(within(filters).getByRole('button', { name: /blocked/i }));
  expect(bodyRows()).toHaveLength(1);
  expect(screen.getByText('Carla Rocha')).toBeInTheDocument();
  await user.click(within(filters).getByRole('button', { name: 'All' }));

  await user.click(screen.getByRole('button', { name: 'Sort by Balance' }));
  expect(within(bodyRows()[0]).getByText('Bruno Costa')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Sort by Balance' }));
  expect(within(bodyRows()[0]).getByText('Ana Silva')).toBeInTheDocument();
});

test('paginates on the client', async () => {
  const user = userEvent.setup();
  renderTable({ pageSize: 2 });
  await screen.findByText('Ana Silva');
  expect(bodyRows()).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(bodyRows()).toHaveLength(1);
  expect(screen.getByText('Carla Rocha')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(screen.getByText('Ana Silva')).toBeInTheDocument();
});

test('sends pagination, search and status to the server when declared', async () => {
  const user = userEvent.setup();
  const api = renderTable({ operationId: 'listOrders', pageSize: 10 });
  expect(await screen.findByText('o1')).toBeInTheDocument();
  expect(api.requests.at(-1)?.url).toBe('/orders?limit=10&offset=0');

  await user.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('o11');
  expect(api.requests.at(-1)?.url).toBe('/orders?limit=10&offset=10');

  const filters = screen.getByRole('group', { name: 'Filter by Status' });
  await user.click(within(filters).getByRole('button', { name: /paid/i }));
  await waitFor(() => {
    expect(api.requests.at(-1)?.url).toBe(
      '/orders?limit=10&offset=0&status=paid'
    );
  });

  await user.type(screen.getByRole('searchbox'), 'o2');
  await waitFor(() => {
    expect(api.requests.at(-1)?.url).toBe(
      '/orders?limit=10&offset=0&q=o2&status=paid'
    );
  });
});

test('uses custom columns and row clicks', async () => {
  const user = userEvent.setup();
  const onRowClick = jest.fn();
  renderTable({
    columns: [
      {
        key: 'name',
        header: 'Client',
        render: ({ item }) => {
          return `${String(item.name)}!`;
        },
      },
      'balance',
    ],
    onRowClick,
    searchable: false,
    filterable: false,
    pagination: 'none',
    actions: <button type="button">{'New client'}</button>,
  });
  await user.click(await screen.findByText('Ana Silva!'));
  expect(onRowClick).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'c1' })
  );
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Next page' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'New client' })
  ).toBeInTheDocument();
  bodyRows()[1].focus();
  await user.keyboard('{Enter}');
  expect(onRowClick).toHaveBeenLastCalledWith(
    expect.objectContaining({ id: 'c2' })
  );
});

test('shows an error with retry', async () => {
  const user = userEvent.setup();
  const api = createFakeApi();
  api.fetcher.mockRejectedValueOnce(new Error('Boom'));
  renderTable({}, api);
  expect(await screen.findByText('Boom')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
});

test('shows the empty states', async () => {
  const user = userEvent.setup();
  const api = createFakeApi();
  api.fetcher.mockResolvedValueOnce([]);
  renderTable({}, api);
  expect(await screen.findByText('No records yet')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText('Ana Silva');
  await user.type(screen.getByRole('searchbox'), 'zzz');
  expect(screen.getByText('No results found')).toBeInTheDocument();
});

test('reports an unknown operation', async () => {
  renderTable({ operationId: 'nope' });
  expect(
    await screen.findByText('Operation "nope" not found in the OpenAPI spec.')
  ).toBeInTheDocument();
});

test('loads the spec from a URL', async () => {
  const api = createFakeApi();
  render(
    <OpenApiProvider specUrl="/openapi.json" fetcher={api.fetcher}>
      <OpenApiTable operationId="listClients" />
    </OpenApiProvider>
  );
  expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
  expect(api.requests[0].url).toBe('/openapi.json');
});
