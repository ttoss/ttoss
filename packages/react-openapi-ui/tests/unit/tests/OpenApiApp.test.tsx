import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@ttoss/test-utils/react';
import * as React from 'react';

import {
  type Fetcher,
  formatLocation,
  OpenApiApp,
  type OpenApiAppProps,
  OpenApiForm,
  type OpenApiLocation,
  OpenApiProvider,
  type OpenApiSpec,
  OpenApiView,
  useResources,
} from '../../../src';
import { createShopApi, shopSpec } from '../resourcesFixtures';

const renderApp = (
  props: OpenApiAppProps = {},
  api = createShopApi(),
  spec: OpenApiSpec = shopSpec
) => {
  const utils = render(
    <OpenApiProvider spec={spec} fetcher={api.fetcher}>
      <OpenApiApp pathPrefix="/api/v1" {...props} />
    </OpenApiProvider>
  );
  return { api, ...utils };
};

const nav = () => {
  return screen.getByRole('navigation', { name: 'Resources' });
};

test('navigates list → detail → edit → detail and deletes a record', async () => {
  const user = userEvent.setup();
  const onNavigate = jest.fn();
  const { api } = renderApp({ onNavigate });

  // Only resources with a list operation are in the menu; the first is open.
  // Notes (`/projects/{project_id}/notes`) waits for its parent id.
  expect(
    within(nav())
      .getAllByRole('button')
      .map((b) => {
        return b.textContent;
      })
  ).toEqual(['Clients', 'Orders', 'Health']);
  expect(
    within(nav()).getByRole('button', { name: 'Clients' })
  ).toHaveAttribute('aria-current', 'page');
  expect(
    await screen.findByRole('heading', { name: 'Clients' })
  ).toBeInTheDocument();

  await user.click(await screen.findByText('Ana Silva'));
  expect(onNavigate).toHaveBeenLastCalledWith({
    resource: 'clients',
    view: 'detail',
    id: 'cli_1',
  });
  expect(
    await screen.findByRole('heading', { name: 'Ana Silva' })
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(
    await screen.findByRole('heading', { name: 'Edit record' })
  ).toBeInTheDocument();
  const name = await screen.findByLabelText('Name');
  await user.clear(name);
  await user.type(name, 'Ana Maria');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByRole('heading', { name: 'Ana Maria' })
  ).toBeInTheDocument();
  expect(
    api.requests.find((r) => {
      return r.method === 'patch';
    })?.body
  ).toEqual({
    name: 'Ana Maria',
  });

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
  expect(
    await screen.findByRole('heading', { name: 'Clients' })
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText('Ana Maria')).not.toBeInTheDocument();
  });
});

test('creates a record and opens it; cancel and back links return', async () => {
  const user = userEvent.setup();
  renderApp();

  await user.click(await screen.findByRole('button', { name: 'New' }));
  expect(
    await screen.findByRole('heading', { name: 'New record' })
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await user.click(await screen.findByRole('button', { name: 'New' }));
  await user.type(await screen.findByLabelText(/Name/), 'Carla Rocha');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByRole('heading', { name: 'Carla Rocha' })
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(await screen.findByRole('button', { name: 'Cancel' }));
  expect(
    await screen.findByRole('heading', { name: 'Carla Rocha' })
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Back' }));
  expect(
    await screen.findByRole('heading', { name: 'Clients' })
  ).toBeInTheDocument();
});

test('runs item and collection actions as forms', async () => {
  const user = userEvent.setup();
  const { api } = renderApp();

  await user.click(await screen.findByRole('button', { name: 'Import' }));
  expect(
    await screen.findByRole('heading', { name: 'Import' })
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Import' }));
  await waitFor(() => {
    expect(
      api.requests.some((r) => {
        return r.method === 'post' && r.url === '/api/v1/clients/import';
      })
    ).toBe(true);
  });
  expect(
    await screen.findByRole('heading', { name: 'Clients' })
  ).toBeInTheDocument();

  await user.click(await screen.findByText('Bruno Costa'));
  await user.click(await screen.findByRole('button', { name: 'Send Email' }));
  await user.type(await screen.findByLabelText(/Subject/), 'Hello');
  await user.click(screen.getByRole('button', { name: 'Send Email' }));
  expect(
    await screen.findByRole('heading', { name: 'Bruno Costa' })
  ).toBeInTheDocument();
  expect(
    api.requests.find((r) => {
      return r.url.endsWith('/send-email');
    })
  ).toMatchObject({
    url: '/api/v1/clients/cli_2/send-email',
    body: { subject: 'Hello' },
  });
});

test('links x-ref values and picks them in forms', async () => {
  const user = userEvent.setup();
  const { api } = renderApp({
    defaultLocation: { resource: 'orders', view: 'list' },
  });

  // The list request asks for the first page; the ref is a link.
  const link = await screen.findByRole('button', { name: 'cli_1' });
  expect(api.requests.at(-1)?.url).toBe('/api/v1/orders?limit=10&offset=0');
  await user.click(link);
  expect(
    await screen.findByRole('heading', { name: 'Ana Silva' })
  ).toBeInTheDocument();

  await user.click(within(nav()).getByRole('button', { name: 'Orders' }));
  await user.click(await screen.findByRole('button', { name: 'New' }));
  const select = await screen.findByLabelText(/Client/);
  await waitFor(() => {
    expect(select).toBeEnabled();
  });
  expect(
    within(select)
      .getAllByRole('option')
      .map((o) => {
        return o.textContent;
      })
  ).toEqual(['Select…', 'Ana Silva', 'Bruno Costa']);
  await user.selectOptions(select, 'cli_2');
  await user.type(screen.getByLabelText('Total'), '50');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  // The API answers without an id, so the screen goes back to the list.
  expect(
    await screen.findByRole('heading', { name: 'Orders' })
  ).toBeInTheDocument();
  expect(
    api.requests.find((r) => {
      return r.method === 'post';
    })?.body
  ).toEqual({ client_id: 'cli_2', total: 50 });
});

test('a ref link handles its own keys inside a clickable row', async () => {
  const user = userEvent.setup();
  const onNavigate = jest.fn();
  renderApp({
    onNavigate,
    defaultLocation: { resource: 'orders', view: 'list' },
  });
  const link = await screen.findByRole('button', { name: 'cli_1' });
  link.focus();
  await user.keyboard('{Enter}');
  expect(onNavigate).toHaveBeenCalledTimes(1);
  expect(onNavigate).toHaveBeenCalledWith({
    resource: 'clients',
    view: 'detail',
    id: 'cli_1',
  });
});

test('a ref value beyond the loaded records stays selected', async () => {
  const api = createShopApi();
  render(
    <OpenApiProvider spec={shopSpec} fetcher={api.fetcher}>
      <OpenApiForm
        operationId="createOrder"
        defaultValues={{ client_id: 'cli_9' }}
      />
    </OpenApiProvider>
  );
  const select = await screen.findByLabelText(/Client/);
  await waitFor(() => {
    expect(within(select).getAllByRole('option')).toHaveLength(4);
  });
  expect(select).toHaveValue('cli_9');
  // Outside OpenApiApp the picker still loads the referenced list.
  expect(api.requests.at(-1)?.url).toBe('/api/v1/clients');
});

test('opens a ref to a record from its detail view', async () => {
  const user = userEvent.setup();
  renderApp({
    defaultLocation: { resource: 'orders', view: 'detail', id: 'ord_1' },
  });
  await user.click(await screen.findByRole('button', { name: 'cli_1' }));
  expect(
    await screen.findByRole('heading', { name: 'Ana Silva' })
  ).toBeInTheDocument();
});

test('passes context params to nested paths', async () => {
  const { api } = renderApp({
    params: { project_id: 'p1' },
    defaultLocation: { resource: 'notes', view: 'list' },
  });
  expect(await screen.findByText('Note of p1')).toBeInTheDocument();
  expect(api.requests.at(-1)?.url).toBe('/api/v1/projects/p1/notes');
  expect(
    within(nav()).getByRole('button', { name: 'Notes' })
  ).toBeInTheDocument();
});

test('controlled with getHref: renders links and leaves URLs to the app', async () => {
  const user = userEvent.setup();
  const Controlled = () => {
    const [location, setLocation] = React.useState<OpenApiLocation>({
      resource: 'clients',
      view: 'list',
    });
    return (
      <OpenApiApp
        pathPrefix="/api/v1"
        location={location}
        onNavigate={setLocation}
        getHref={(next) => {
          return `/admin${formatLocation(next)}`;
        }}
      />
    );
  };
  const api = createShopApi();
  render(
    <OpenApiProvider spec={shopSpec} fetcher={api.fetcher}>
      <Controlled />
    </OpenApiProvider>
  );
  const orders = within(nav()).getByRole('link', { name: 'Orders' });
  expect(orders).toHaveAttribute('href', '/admin/orders');
  expect(await screen.findByRole('link', { name: 'New' })).toHaveAttribute(
    'href',
    '/admin/clients/new'
  );

  // A modified click is left to the browser (new tab): no navigation.
  // jsdom reports that it cannot follow the link itself.
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
    return undefined;
  });
  fireEvent.click(orders, { ctrlKey: true });
  consoleError.mockRestore();
  expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument();

  await user.click(orders);
  expect(
    await screen.findByRole('heading', { name: 'Orders' })
  ).toBeInTheDocument();
  expect(orders).toHaveAttribute('aria-current', 'page');
});

const renderView = (location: OpenApiLocation, api = createShopApi()) => {
  const onNavigate = jest.fn();
  render(
    <OpenApiProvider spec={shopSpec} fetcher={api.fetcher}>
      <OpenApiView location={location} onNavigate={onNavigate} />
    </OpenApiProvider>
  );
  return onNavigate;
};

test.each<[OpenApiLocation, string]>([
  [{ resource: 'nope', view: 'list' }, 'This API has no resource "nope".'],
  [
    { resource: 'auth', view: 'list' },
    'This API has no operation for this screen.',
  ],
  [
    { resource: 'notes', view: 'create' },
    'This API has no operation for this screen.',
  ],
  [
    { resource: 'notes', view: 'detail', id: 'n1' },
    'This API has no operation for this screen.',
  ],
  [
    { resource: 'orders', view: 'edit', id: 'ord_1' },
    'This API has no operation for this screen.',
  ],
  [
    { resource: 'clients', view: 'action', action: 'missing' },
    'This API has no operation for this screen.',
  ],
  [
    { resource: 'clients', view: 'action', action: 'sendClientEmail' },
    'This API has no operation for this screen.',
  ],
])('OpenApiView %j says what is missing', (location, text) => {
  renderView(location);
  expect(screen.getByText(text)).toBeInTheDocument();
});

test('OpenApiView renders one screen and reports navigation', async () => {
  const user = userEvent.setup();
  const onNavigate = renderView({ resource: 'clients', view: 'list' });
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  await user.click(await screen.findByText('Bruno Costa'));
  expect(onNavigate).toHaveBeenCalledWith({
    resource: 'clients',
    view: 'detail',
    id: 'cli_2',
  });
});

test('an action of a resource without a detail view returns to the list', async () => {
  const user = userEvent.setup();
  const api = createShopApi();
  const onNavigate = renderView(
    { resource: 'auth', view: 'action', action: 'issueToken' },
    api
  );
  api.fetcher.mockResolvedValueOnce({ token: 't' });
  await user.click(await screen.findByRole('button', { name: 'Token' }));
  await waitFor(() => {
    expect(onNavigate).toHaveBeenCalledWith({ resource: 'auth', view: 'list' });
  });
});

test('shows the spec error with a retry, a skeleton while it loads', async () => {
  const user = userEvent.setup();
  const fetcher = jest
    .fn<ReturnType<Fetcher>, Parameters<Fetcher>>()
    .mockRejectedValueOnce(new Error('Spec down'))
    .mockResolvedValueOnce(shopSpec)
    .mockResolvedValue([]);
  render(
    <OpenApiProvider specUrl="/openapi.json" fetcher={fetcher}>
      <OpenApiApp pathPrefix="/api/v1" />
    </OpenApiProvider>
  );
  expect(await screen.findByText('Spec down')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('heading', { name: 'Clients' })
  ).toBeInTheDocument();
});

test('says so when the spec has nothing to list', () => {
  renderApp({}, createShopApi(), { paths: {} });
  expect(
    screen.getByText('The API describes no resource to show.')
  ).toBeInTheDocument();
});

test('a ref field falls back to a text input without a usable list', async () => {
  const user = userEvent.setup();
  const spec: OpenApiSpec = {
    paths: {
      '/things': {
        post: {
          operationId: 'createThing',
          tags: ['Things'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    owner_id: { type: 'string', 'x-ref': 'owners' },
                    client_id: { type: 'string', 'x-ref': 'clients' },
                  },
                },
              },
            },
          },
        },
      },
      '/clients': {
        get: { operationId: 'listClients', tags: ['Clients'] },
      },
    },
  };
  const fetcher = jest
    .fn<ReturnType<Fetcher>, Parameters<Fetcher>>()
    .mockRejectedValue(new Error('down'));
  render(
    <OpenApiProvider spec={spec} fetcher={fetcher}>
      <OpenApiView
        location={{ resource: 'things', view: 'action', action: 'createThing' }}
        onNavigate={jest.fn()}
      />
    </OpenApiProvider>
  );
  // No `owners` resource; the `clients` list fails: both become text inputs.
  await waitFor(() => {
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });
  await user.type(screen.getByLabelText('Owner Id'), 'o1');
  expect(screen.getByLabelText('Owner Id')).toHaveValue('o1');
});

test('useResources reads the spec outside OpenApiApp', () => {
  const Keys = () => {
    const resources = useResources({ tags: ['Orders'] });
    return (
      <span>
        {resources
          .map((r) => {
            return r.key;
          })
          .join(',')}
      </span>
    );
  };
  render(
    <OpenApiProvider spec={shopSpec} fetcher={jest.fn()}>
      <Keys />
    </OpenApiProvider>
  );
  expect(screen.getByText('orders')).toBeInTheDocument();
});
