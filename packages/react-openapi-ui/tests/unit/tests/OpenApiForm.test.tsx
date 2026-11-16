import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@ttoss/test-utils/react';

import {
  OpenApiForm,
  OpenApiProvider,
  OpenApiRequestError,
  type OpenApiSpec,
} from '../../../src';
import { spec } from '../fixtures';
import { createFakeApi } from './fakeApi';

const renderForm = (
  props: React.ComponentProps<typeof OpenApiForm>,
  {
    api = createFakeApi(),
    formSpec = spec,
  }: { api?: ReturnType<typeof createFakeApi>; formSpec?: OpenApiSpec } = {}
) => {
  render(
    <OpenApiProvider spec={formSpec} fetcher={api.fetcher}>
      <OpenApiForm {...props} />
    </OpenApiProvider>
  );
  return api;
};

test('validates and creates a record', async () => {
  const user = userEvent.setup();
  const onSuccess = jest.fn();
  const api = renderForm({
    operationId: 'createClient',
    onSuccess,
    submitLabel: 'Create',
  });

  expect(screen.getByLabelText(/^Status/)).toHaveValue('active');
  await user.click(screen.getByRole('button', { name: 'Create' }));
  expect(
    screen.getByText('Fix the highlighted fields and try again.')
  ).toBeInTheDocument();
  expect(screen.getAllByText('This field is required.')).toHaveLength(2);
  expect(screen.getByLabelText(/^Name/)).toHaveAttribute(
    'aria-invalid',
    'true'
  );

  await user.type(screen.getByLabelText(/^Name/), 'A');
  await user.type(screen.getByLabelText(/^Email/), 'new@example.com');
  await user.type(screen.getByLabelText(/^Balance/), '-1');
  await user.click(screen.getByRole('button', { name: 'Create' }));
  expect(
    screen.getByText('Must have at least 2 characters.')
  ).toBeInTheDocument();
  expect(screen.getByText('Must be at least 0.')).toBeInTheDocument();

  await user.type(screen.getByLabelText(/^Name/), 'na');
  await user.clear(screen.getByLabelText(/^Balance/));
  await user.type(screen.getByLabelText(/^Balance/), '10');
  await user.click(screen.getByLabelText('Vip'));
  await user.type(screen.getByLabelText('Notes'), 'hello');
  await user.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c4' })
    );
  });
  expect(api.requests.at(-1)).toMatchObject({
    method: 'post',
    url: '/clients',
    body: {
      name: 'Ana',
      email: 'new@example.com',
      status: 'active',
      balance: 10,
      vip: true,
      notes: 'hello',
    },
  });
  expect(screen.getByText('Saved successfully.')).toBeInTheDocument();
});

test('shows server field errors', async () => {
  const user = userEvent.setup();
  renderForm({ operationId: 'createClient', fields: ['name', 'email'] });
  await user.type(screen.getByLabelText(/^Name/), 'Ana');
  await user.type(screen.getByLabelText(/^Email/), 'ana@example.com');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Email already in use.')).toBeInTheDocument();
  expect(screen.getByText('Could not save')).toBeInTheDocument();
  await user.type(screen.getByLabelText(/^Email/), 'x');
  expect(screen.queryByText('Email already in use.')).not.toBeInTheDocument();
});

test('reads object-shaped server errors', async () => {
  const user = userEvent.setup();
  const api = createFakeApi();
  renderForm(
    { operationId: 'createClient', fields: ['name', 'email'] },
    { api }
  );
  api.fetcher.mockRejectedValueOnce(
    new OpenApiRequestError({
      status: 422,
      body: { errors: { name: ['Too common.'] } },
      message: 'Invalid',
    })
  );
  await user.type(screen.getByLabelText(/^Name/), 'Ana');
  await user.type(screen.getByLabelText(/^Email/), 'x@example.com');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Too common.')).toBeInTheDocument();
});

test('loads the record of a PATCH and sends only changed fields', async () => {
  const user = userEvent.setup();
  const onCancel = jest.fn();
  const api = renderForm({
    operationId: 'updateClient',
    params: { client_id: 'c1' },
    onCancel,
  });
  const name = await screen.findByLabelText('Name');
  expect(name).toHaveValue('Ana Silva');
  await user.clear(screen.getByLabelText('Balance'));
  await user.type(screen.getByLabelText('Balance'), '999');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Saved successfully.');
  expect(api.requests.at(-1)).toMatchObject({
    method: 'patch',
    url: '/clients/c1',
    body: { balance: 999 },
  });
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalled();
});

test('uses a given record, default values and custom fields', async () => {
  const user = userEvent.setup();
  const api = renderForm({
    operationId: 'replaceClient',
    params: { client_id: 'c2' },
    record: { name: 'Bruno', email: 'b@example.com' },
    defaultValues: { notes: 'from defaults' },
    resetOnSuccess: true,
    fields: [
      { name: 'name', label: 'Client name', description: 'As on the document' },
      'email',
      {
        name: 'notes',
        render: ({ value, onChange }) => {
          return (
            <input
              aria-label="Custom notes"
              value={String(value)}
              onChange={(event) => {
                onChange(event.target.value);
              }}
            />
          );
        },
      },
    ],
  });
  expect(screen.getByLabelText(/^Client name/)).toHaveValue('Bruno');
  expect(screen.getByText('As on the document')).toBeInTheDocument();
  expect(screen.getByLabelText('Custom notes')).toHaveValue('from defaults');
  await user.type(screen.getByLabelText('Custom notes'), '!');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Saved successfully.');
  expect(api.requests.at(-1)).toMatchObject({
    method: 'put',
    body: { name: 'Bruno', email: 'b@example.com', notes: 'from defaults!' },
  });
  expect(
    api.requests.filter((r) => {
      return r.method === 'get';
    })
  ).toHaveLength(0);
  expect(screen.getByLabelText('Custom notes')).toHaveValue('from defaults');
});

test('submits multipart bodies', async () => {
  const user = userEvent.setup();
  const api = renderForm({
    operationId: 'uploadDocument',
    params: { client_id: 'c1' },
  });
  const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });
  await user.upload(screen.getByLabelText(/^File/), file);
  await user.type(screen.getByLabelText('Label'), 'Contract');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Saved successfully.');
  const body = api.requests.at(-1)?.body as FormData;
  expect(body).toBeInstanceOf(FormData);
  expect((body.get('file') as File).name).toBe('doc.txt');
  expect(body.get('label')).toBe('Contract');
});

test('renders a control for every field kind', async () => {
  const user = userEvent.setup();
  const kitchen: OpenApiSpec = {
    openapi: '3.1.0',
    paths: {
      '/things': {
        post: {
          operationId: 'createThing',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['kind'],
                  properties: {
                    kind: { type: 'string', enum: ['a', 'b'] },
                    colors: { type: 'array', items: { enum: ['red', 'blue'] } },
                    meta: { type: 'object' },
                    count: { type: 'integer' },
                    day: { type: 'string', format: 'date' },
                    at: { type: 'string', format: 'date-time' },
                    secret: { type: 'string', example: 'shh' },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const api = renderForm({ operationId: 'createThing' }, { formSpec: kitchen });
  await user.selectOptions(screen.getByLabelText(/^Kind/), 'b');
  await user.click(screen.getByLabelText('Red'));
  await user.click(screen.getByLabelText('Blue'));
  await user.click(screen.getByLabelText('Red'));
  fireEvent.change(screen.getByLabelText('Meta'), { target: { value: '[1]' } });
  await user.type(screen.getByLabelText('Count'), '1.5');
  fireEvent.change(screen.getByLabelText('Day'), {
    target: { value: '2026-01-02' },
  });
  fireEvent.change(screen.getByLabelText('At'), {
    target: { value: '2026-01-02T03:04' },
  });
  expect(screen.getByLabelText('Secret')).toHaveAttribute('type', 'password');
  expect(screen.getByLabelText('Secret')).toHaveAttribute('placeholder', 'shh');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Must be a JSON object.')).toBeInTheDocument();
  expect(screen.getByText('Enter a whole number.')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Meta'), {
    target: { value: '{"a":1}' },
  });
  await user.clear(screen.getByLabelText('Count'));
  await user.type(screen.getByLabelText('Count'), '2');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => {
    expect(api.requests.at(-1)?.body).toEqual({
      kind: 'b',
      colors: ['blue'],
      meta: { a: 1 },
      count: 2,
      day: '2026-01-02',
      at: new Date('2026-01-02T03:04').toISOString(),
    });
  });
});

test('handles operations without fields and unknown operations', async () => {
  renderForm({ operationId: 'deleteClient', params: { client_id: 'c1' } });
  expect(
    screen.getByText('This operation takes no input.')
  ).toBeInTheDocument();
});

test('reports an unknown operation', () => {
  renderForm({ operationId: 'nope' });
  expect(
    screen.getByText('Operation "nope" not found in the OpenAPI spec.')
  ).toBeInTheDocument();
});

test('reports a record that fails to load', async () => {
  renderForm({ operationId: 'updateClient', params: { client_id: 'missing' } });
  expect(await screen.findByText('Client not found')).toBeInTheDocument();
});

test('reports a spec that fails to load', async () => {
  const api = createFakeApi();
  api.fetcher.mockRejectedValueOnce(new Error('No spec'));
  render(
    <OpenApiProvider specUrl="/openapi.json" fetcher={api.fetcher}>
      <OpenApiForm operationId="createClient" />
    </OpenApiProvider>
  );
  expect(await screen.findByText('No spec')).toBeInTheDocument();
});
