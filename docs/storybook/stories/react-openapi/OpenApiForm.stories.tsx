import '@ttoss/react-openapi/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { OpenApiForm, OpenApiProvider } from '@ttoss/react-openapi';

import { spec } from './fixtures';
import { Frame, RequestLog, useLoggedFakeApi } from './storyUtils';

const meta: Meta<typeof OpenApiForm> = {
  title: 'React OpenAPI/OpenApiForm',
  component: OpenApiForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "A form generated from an OpenAPI operation's request body. Each writable field gets a control chosen from its schema (text, email, number, select, checkboxes, date, file, JSON), with the label, help text and validation (`required`, `minLength`, `minimum`, `pattern`…) the spec declares. A PUT/PATCH loads the record from the GET on the same path, and a PATCH sends only what changed. These stories run against an in-memory fake API; the panel below each form shows the requests it sent.",
      },
    },
  },
  render: (args) => {
    const { fetcher, log } = useLoggedFakeApi();
    return (
      <Frame maxWidth={560}>
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          <OpenApiForm {...args} />
        </OpenApiProvider>
        <RequestLog log={log} />
      </Frame>
    );
  },
};

export default meta;

type Story = StoryObj<typeof OpenApiForm>;

export const Create: Story = {
  args: { operationId: 'createClient', submitLabel: 'Create client' },
  parameters: {
    docs: {
      description: {
        story:
          '`createClient` (POST) with a `ClientInput` body. `status` starts at its schema default, `tags` (an array of enum) renders as checkboxes, `notes` as a textarea and `address` (an object) as JSON. Submit empty to see client-side validation; use an existing email (e.g. `ana.silva0@example.com`) to see a field error returned by the server.',
      },
    },
  },
};

export const Edit: Story = {
  args: { operationId: 'updateClient', params: { client_id: 'cli_1004' } },
  parameters: {
    docs: {
      description: {
        story:
          '`updateClient` (PATCH). The form finds `getClient` on the same path and pre-fills from it. Change one field and save: the request carries only that field.',
      },
    },
  },
};

export const Action: Story = {
  args: {
    operationId: 'sendClientEmail',
    params: { client_id: 'cli_1001' },
    submitLabel: 'Send email',
    resetOnSuccess: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Any operation with a body becomes a form — here an action, `POST /clients/{client_id}/send-email`. `send_at` (`date-time`) uses a local date-time input and is sent as ISO 8601.',
      },
    },
  },
};

export const FileUpload: Story = {
  args: {
    operationId: 'uploadClientDocument',
    params: { client_id: 'cli_1001' },
    submitLabel: 'Upload',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A `multipart/form-data` body: `format: binary` becomes a file input and the request is sent as `FormData`.',
      },
    },
  },
};

export const ChosenFields: Story = {
  args: {
    operationId: 'createClient',
    fields: [
      'name',
      { name: 'email', label: 'Work email', description: 'We never share it.' },
      'vip',
    ],
    submitLabel: 'Create client',
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '`fields` chooses and orders the fields, and can relabel them. `onCancel` adds a cancel button.',
      },
    },
  },
};
