import '@ttoss/react-openapi/styles.css';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  formatLocation,
  OpenApiApp,
  type OpenApiLocation,
  OpenApiProvider,
} from '@ttoss/react-openapi';
import * as React from 'react';

import { createSoatFakeApi, soatSpec } from './soatFakeApi';
import { Frame, RequestLog } from './storyUtils';

const PROJECTS = [
  { id: 'proj_support', name: 'Customer Support' },
  { id: 'proj_research', name: 'Research Lab' },
  { id: 'proj_ops', name: 'Internal Ops' },
];

const useLoggedSoatApi = () => {
  const [log, setLog] = React.useState<string[]>([]);
  const fetcher = React.useMemo(() => {
    return createSoatFakeApi({
      onRequest: (entry) => {
        setLog((current) => {
          return [entry, ...current].slice(0, 8);
        });
      },
    });
  }, []);
  return { fetcher, log };
};

const ProjectPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        fontSize: 13,
      }}
    >
      {'Active project (sent as '}
      <code>{'project_id'}</code>
      {'):'}
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {PROJECTS.map((project) => {
          return (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          );
        })}
      </select>
    </label>
  );
};

const SoatAdmin = ({ initial }: { initial: OpenApiLocation }) => {
  const { fetcher, log } = useLoggedSoatApi();
  const [projectId, setProjectId] = React.useState(PROJECTS[0].id);
  const [location, setLocation] = React.useState<OpenApiLocation>(initial);
  return (
    <Frame>
      <ProjectPicker value={projectId} onChange={setProjectId} />
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
      <OpenApiProvider spec={soatSpec} fetcher={fetcher}>
        <OpenApiApp
          key={projectId}
          pathPrefix="/api/v1"
          params={{ project_id: projectId }}
          location={location}
          onNavigate={setLocation}
        />
      </OpenApiProvider>
      <RequestLog log={log} />
    </Frame>
  );
};

const meta: Meta = {
  title: 'React OpenAPI/SOAT spec',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `OpenApiApp` running on the real SOAT REST API spec (a slice of the bundle at https://soat.ttoss.dev/docs/openapi-specs, unchanged) against an in-memory fake of the API. Nothing is configured per resource: parameters declared by `$ref` fill the URLs, lists page with `limit` + `cursor` and follow `next_cursor`, `project_id` goes to every operation that declares it, `x-soat-ref` ids are pickers and links (arrays of ids such as `guardrail_ids` are checkboxes and lists of links), and the Evaluations tag becomes two resources, Datasets and Evals.',
      },
    },
  },
};

export default meta;

/**
 * Agents of the active project: 23 in Customer Support, so the table pages
 * by cursor. Open one to follow its `guardrail_ids` and `policy_ids` links.
 */
export const Agents: StoryObj = {
  render: () => {
    return <SoatAdmin initial={{ resource: 'agents', view: 'list' }} />;
  },
};

/**
 * A project's edit form: `guardrail_ids` and `agent_policy_ids` are arrays of
 * ids (`x-soat-ref` on the array), `default_model_route_id` a single one.
 */
export const EditProject: StoryObj = {
  render: () => {
    return (
      <SoatAdmin
        initial={{ resource: 'projects', view: 'edit', id: 'proj_support' }}
      />
    );
  },
};

/** One tag, two collections: Evaluations holds `/datasets` and `/evals`. */
export const Evaluations: StoryObj = {
  render: () => {
    return <SoatAdmin initial={{ resource: 'evals', view: 'list' }} />;
  },
};
