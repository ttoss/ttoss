import '@ttoss/react-openapi/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  OpenApiDeleteButton,
  OpenApiDetail,
  OpenApiForm,
  OpenApiProvider,
  OpenApiTable,
} from '@ttoss/react-openapi';
import * as React from 'react';

import { spec } from './fixtures';
import { Frame, RequestLog, useLoggedFakeApi } from './storyUtils';

type View =
  | { name: 'list' }
  | { name: 'detail'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'create' };

const buttonStyle: React.CSSProperties = {
  height: 32,
  padding: '0 12px',
  borderRadius: 6,
  border: '1px solid #e5e5e5',
  background: '#ffffff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: 'none',
  background: '#171717',
  color: '#fafafa',
};

const Heading = ({ children }: { children: React.ReactNode }) => {
  return <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>{children}</h2>;
};

const BackLink = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        background: 'none',
        padding: 0,
        marginBottom: 16,
        color: '#737373',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
      }}
    >
      {'← Clients'}
    </button>
  );
};

/**
 * The navigation an app would do with its router, kept in local state here.
 * Every screen is one `@ttoss/react-openapi` component bound to an
 * `operationId`; the app only decides where each action leads.
 */
const ClientsAdmin = () => {
  const { fetcher, log } = useLoggedFakeApi({ latency: 350 });
  const [view, setView] = React.useState<View>({ name: 'list' });
  const toList = () => {
    setView({ name: 'list' });
  };

  return (
    <Frame>
      <OpenApiProvider spec={spec} fetcher={fetcher}>
        {view.name === 'list' && (
          <>
            <Heading>{'Clients'}</Heading>
            <OpenApiTable
              operationId="listClients"
              onRowClick={(client) => {
                setView({ name: 'detail', id: String(client.id) });
              }}
              actions={
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() => {
                    setView({ name: 'create' });
                  }}
                >
                  {'New client'}
                </button>
              }
            />
          </>
        )}

        {view.name === 'detail' && (
          <>
            <BackLink onClick={toList} />
            <OpenApiDetail
              operationId="getClient"
              params={{ client_id: view.id }}
              actions={({ record }) => {
                return (
                  <>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => {
                        setView({ name: 'edit', id: view.id });
                      }}
                    >
                      {'Edit'}
                    </button>
                    <OpenApiDeleteButton
                      operationId="deleteClient"
                      params={{ client_id: view.id }}
                      recordName={String(record.name)}
                      onSuccess={toList}
                    />
                  </>
                );
              }}
            />
          </>
        )}

        {view.name === 'edit' && (
          <div style={{ maxWidth: 560 }}>
            <BackLink onClick={toList} />
            <Heading>{'Edit client'}</Heading>
            <OpenApiForm
              operationId="updateClient"
              params={{ client_id: view.id }}
              onSuccess={() => {
                setView({ name: 'detail', id: view.id });
              }}
              onCancel={() => {
                setView({ name: 'detail', id: view.id });
              }}
            />
          </div>
        )}

        {view.name === 'create' && (
          <div style={{ maxWidth: 560 }}>
            <BackLink onClick={toList} />
            <Heading>{'New client'}</Heading>
            <OpenApiForm
              operationId="createClient"
              submitLabel="Create client"
              onSuccess={(created) => {
                setView({
                  name: 'detail',
                  id: String((created as { id: string }).id),
                });
              }}
              onCancel={toList}
            />
          </div>
        )}
      </OpenApiProvider>
      <RequestLog log={log} />
    </Frame>
  );
};

const meta: Meta = {
  title: 'React OpenAPI/CRUD Example',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A complete admin for the `Clients` resource, built only from `OpenApiTable`, `OpenApiDetail`, `OpenApiForm` and `OpenApiDeleteButton`, each bound to an `operationId` of the spec. The app code is the navigation between them. Click a row to open it, then edit or delete; "New client" creates one. The fake API keeps its data while the story is open.',
      },
    },
  },
};

export default meta;

export const ClientsAdminPanel: StoryObj = {
  render: () => {
    return <ClientsAdmin />;
  },
};
