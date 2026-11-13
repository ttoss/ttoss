import '@ttoss/react-openapi/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  OpenApiDeleteButton,
  OpenApiDetail,
  OpenApiProvider,
} from '@ttoss/react-openapi';

import { spec } from './fixtures';
import { Frame, RequestLog, useLoggedFakeApi } from './storyUtils';

const meta: Meta<typeof OpenApiDetail> = {
  title: 'React OpenAPI/OpenApiDetail',
  component: OpenApiDetail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A read-only view of one record loaded from an OpenAPI GET operation. Fields follow the response schema: labelled, formatted for the locale, with objects and long text across the full width and sensitive values (here `api_key`) masked behind a "Show" toggle. `OpenApiDeleteButton` calls a DELETE operation after a confirmation dialog.',
      },
    },
  },
  render: (args) => {
    const { fetcher, log } = useLoggedFakeApi();
    return (
      <Frame maxWidth={900}>
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          <OpenApiDetail {...args} />
        </OpenApiProvider>
        <RequestLog log={log} />
      </Frame>
    );
  },
};

export default meta;

type Story = StoryObj<typeof OpenApiDetail>;

export const Default: Story = {
  args: { operationId: 'getClient', params: { client_id: 'cli_1000' } },
};

export const WithActions: Story = {
  args: {
    operationId: 'getClient',
    params: { client_id: 'cli_1003' },
    fields: ['email', 'status', 'balance', 'vip', 'address'],
    actions: ({ record }) => {
      return (
        <OpenApiDeleteButton
          operationId="deleteClient"
          params={{ client_id: String(record.id) }}
          recordName={String(record.name)}
        />
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '`fields` picks the fields; `actions` receives the record, here to wire a delete button to `deleteClient`.',
      },
    },
  },
};

export const NotFound: Story = {
  args: { operationId: 'getClient', params: { client_id: 'cli_missing' } },
  parameters: {
    docs: {
      description: { story: 'The API error is shown with a retry button.' },
    },
  },
};
