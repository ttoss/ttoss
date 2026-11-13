import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';

import {
  OpenApiDeleteButton,
  OpenApiDetail,
  OpenApiProvider,
} from '../../../src';
import { spec } from '../fixtures';
import { createFakeApi } from './fakeApi';

const renderWithApi = (ui: React.ReactNode, api = createFakeApi()) => {
  render(
    <OpenApiProvider spec={spec} fetcher={api.fetcher}>
      {ui}
    </OpenApiProvider>
  );
  return api;
};

test('shows every field of the record', async () => {
  const user = userEvent.setup();
  renderWithApi(
    <OpenApiDetail operationId="getClient" params={{ client_id: 'c1' }} />
  );
  expect(
    await screen.findByRole('heading', { name: 'Ana Silva' })
  ).toBeInTheDocument();
  expect(screen.getByText('Full name')).toBeInTheDocument();
  expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  expect(screen.getByText('Recife')).toBeInTheDocument();
  expect(screen.getByText('gold')).toBeInTheDocument();
  expect(screen.getByText('Yes')).toBeInTheDocument();
  expect(screen.queryByText('sk_live_123')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Show Api Key' }));
  expect(screen.getByText('sk_live_123')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Hide' }));
  expect(screen.queryByText('sk_live_123')).not.toBeInTheDocument();
});

test('chooses fields, title and actions', async () => {
  const refetchSpy = jest.fn();
  renderWithApi(
    <OpenApiDetail
      operationId="getClient"
      params={{ client_id: 'c3' }}
      fields={[
        'name',
        {
          key: 'email',
          label: 'E-mail',
          render: ({ value }) => {
            return `<${String(value)}>`;
          },
        },
        'address',
      ]}
      hideEmpty
      title={(record) => {
        return `Client ${String(record.id)}`;
      }}
      actions={({ refetch }) => {
        refetchSpy.mockImplementation(refetch);
        return <button type="button">{'Edit'}</button>;
      }}
    />
  );
  expect(
    await screen.findByRole('heading', { name: 'Client c3' })
  ).toBeInTheDocument();
  expect(screen.getByText('E-mail')).toBeInTheDocument();
  expect(screen.getByText('<carla@example.com>')).toBeInTheDocument();
  expect(screen.queryByText('Address')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
});

test('hides the heading and shows a static action', async () => {
  renderWithApi(
    <OpenApiDetail
      operationId="getClient"
      params={{ client_id: 'c2' }}
      title={null}
      actions={<span>{'static'}</span>}
    />
  );
  expect(await screen.findByText('static')).toBeInTheDocument();
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

test('shows load errors with retry and a missing record', async () => {
  const user = userEvent.setup();
  const api = renderWithApi(
    <OpenApiDetail operationId="getClient" params={{ client_id: 'missing' }} />
  );
  expect(await screen.findByText('Client not found')).toBeInTheDocument();
  api.fetcher.mockResolvedValueOnce(null);
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Record not found.')).toBeInTheDocument();
});

test('deletes after confirmation', async () => {
  const user = userEvent.setup();
  const onSuccess = jest.fn();
  const api = renderWithApi(
    <OpenApiDeleteButton
      operationId="deleteClient"
      params={{ client_id: 'c1' }}
      recordName="Ana Silva"
      onSuccess={onSuccess}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(
    screen.getByRole('heading', { name: 'Delete Ana Silva?' })
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  const buttons = screen.getAllByRole('button', { name: 'Delete' });
  await user.click(buttons[buttons.length - 1]);
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
  expect(api.requests.at(-1)).toMatchObject({
    method: 'delete',
    url: '/clients/c1',
  });
});

test('shows the delete error inside the dialog', async () => {
  const user = userEvent.setup();
  renderWithApi(
    <OpenApiDeleteButton
      operationId="deleteClient"
      params={{ client_id: 'missing' }}
      label="Remove"
    />
  );
  await user.click(screen.getByRole('button', { name: 'Remove' }));
  expect(
    screen.getByRole('heading', { name: 'Delete this record?' })
  ).toBeInTheDocument();
  const buttons = screen.getAllByRole('button', { name: 'Remove' });
  await user.click(buttons[buttons.length - 1]);
  expect(await screen.findByText('Could not delete')).toBeInTheDocument();
  expect(screen.getByText('Client not found')).toBeInTheDocument();
});
