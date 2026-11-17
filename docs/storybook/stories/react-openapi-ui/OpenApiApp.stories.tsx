import '@ttoss/react-openapi-ui/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  formatLocation,
  OpenApiApp,
  type OpenApiLocation,
  OpenApiProvider,
  OpenApiView,
} from '@ttoss/react-openapi-ui';
import * as React from 'react';

import { spec } from './fixtures';
import { Frame, RequestLog, useLoggedFakeApi } from './storyUtils';

const Uncontrolled = () => {
  const { fetcher, log } = useLoggedFakeApi({ latency: 300 });
  return (
    <Frame>
      <OpenApiProvider spec={spec} fetcher={fetcher}>
        <OpenApiApp pathPrefix="/api/v1" />
      </OpenApiProvider>
      <RequestLog log={log} />
    </Frame>
  );
};

/**
 * What an app does with its router: the location lives in the URL. Here the
 * "URL" is local state shown above the admin, so the story stays isolated.
 */
const Routed = () => {
  const { fetcher, log } = useLoggedFakeApi({ latency: 300 });
  const [location, setLocation] = React.useState<OpenApiLocation>({
    resource: 'orders',
    view: 'list',
  });
  return (
    <Frame>
      <code
        style={{
          display: 'block',
          marginBottom: 16,
          padding: '6px 10px',
          borderRadius: 6,
          background: '#f5f5f5',
          fontSize: 12,
        }}
      >
        {`/admin${formatLocation(location)}`}
      </code>
      <OpenApiProvider spec={spec} fetcher={fetcher}>
        <OpenApiApp
          pathPrefix="/api/v1"
          location={location}
          onNavigate={setLocation}
        />
      </OpenApiProvider>
      <RequestLog log={log} />
    </Frame>
  );
};

const SingleView = () => {
  const { fetcher, log } = useLoggedFakeApi({ latency: 300 });
  const [location, setLocation] = React.useState<OpenApiLocation>({
    resource: 'clients',
    view: 'list',
  });
  return (
    <Frame maxWidth={900}>
      <OpenApiProvider spec={spec} fetcher={fetcher}>
        <OpenApiView
          pathPrefix="/api/v1"
          location={location}
          onNavigate={setLocation}
        />
      </OpenApiProvider>
      <RequestLog log={log} />
    </Frame>
  );
};

const meta: Meta = {
  title: 'React OpenAPI UI/OpenApiApp',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A complete admin generated from the spec, with no `operationId` wired by hand. Operations are grouped by tag into resources, and each gets its screen from its HTTP method and path shape: `GET /clients` is the table, `POST /clients` the create form, `GET`/`PATCH`/`DELETE /clients/{client_id}` the record, its edit form and delete button, and other writes (`send-email`, `documents`) become action forms. `client_id` on orders carries `x-ref: clients`, so it links to the client and is a picker in the order form. The spec holds no UI instructions; the screens follow from these conventions.',
      },
    },
  },
};

export default meta;

/** The component keeps the location itself; open a client, edit it, or create an order. */
export const Default: StoryObj = {
  render: () => {
    return <Uncontrolled />;
  },
};

/** Controlled: `location` and `onNavigate` connect it to the app's router. */
export const WithRouter: StoryObj = {
  render: () => {
    return <Routed />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'The app owns the location (`location` + `onNavigate`) and turns it into a URL with `formatLocation`; `parseLocation` reads it back. Pass `getHref` to render real links.',
      },
    },
  },
};

/** One screen without the menu, for apps that lay out their own navigation. */
export const ViewOnly: StoryObj = {
  render: () => {
    return <SingleView />;
  },
  parameters: {
    docs: {
      description: {
        story:
          '`OpenApiView` renders only the screen for `location`, so the app keeps its own menu and layout.',
      },
    },
  },
};
