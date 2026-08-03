import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  ContextualHelp,
  Form,
  FormActions,
  FormSubmit,
  Heading,
  NumberField,
  Radio,
  RadioGroup,
  SearchField,
  Slider,
  Stack,
  Surface,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  TextField,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import type { DeployEvent, EnvironmentType } from '../data';
import { createEnvironment, useWorkspace } from '../store';
import { toasts } from '../toasts';
import { formText } from './SettingsPage';

/** The deploy events an environment can notify on, in reporting order. */
export const EVENT_LABELS: Record<DeployEvent, string> = {
  started: 'Started',
  succeeded: 'Succeeded',
  failed: 'Failed',
  'rolled-back': 'Rolled back',
};

/**
 * An environment name ends up in deploy URLs, so it carries the same shape
 * rule as the workspace slug — and it is the field the fictional backend can
 * still refuse (a duplicate), which client validation cannot know.
 */
export const validateEnvironmentName = (value: string): string | null => {
  if (value.trim() === '') return 'Enter an environment name.';
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Use lowercase letters, numbers and dashes only.';
  }
  return null;
};

/**
 * The create form — the forms plan's complete form (item I): every field kind
 * that had no Studio consumer stands here in one flow, plus the two inherited
 * capabilities nothing had exercised — a submit that is genuinely async
 * (`FormSubmit isPending`) and a refusal only the server can issue
 * (`validationErrors`, routed to the field by `name`).
 */
const NewEnvironmentForm = ({ onDone }: { onDone: () => void }) => {
  const [isPending, setIsPending] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<
    Record<string, string>
  >({});
  // The Slider is the one control here without native form participation
  // (React Aria gives it no `name` — a slider is not a text-serializable
  // input), so its value is component state rather than FormData.
  const [cpuTarget, setCpuTarget] = React.useState(0.7);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A pending submit disarms the button, but the FORM can still fire — the
    // platform's implicit submission (Enter in a text input) reaches the
    // handler directly, so the host that owns the lifecycle guards re-entry.
    if (isPending) return;
    const data = new FormData(event.currentTarget);
    setServerErrors({});
    setIsPending(true);
    createEnvironment({
      name: formText(data, 'name'),
      type: formText(data, 'type') as EnvironmentType,
      branch: formText(data, 'branch'),
      instances: Number(data.get('instances')),
      cpuTarget,
      notifications: data.getAll('notifications') as DeployEvent[],
    })
      .then((created) => {
        setIsPending(false);
        onDone();
        toasts.add(
          { title: `Environment ${created.name} created` },
          { timeout: 4000 }
        );
      })
      .catch((error: Error) => {
        // The server's refusal lands on the field that caused it: React
        // Aria's Form routes `validationErrors` by field `name`, and the
        // message clears the moment the member edits the name.
        setIsPending(false);
        setServerErrors({ name: error.message });
      });
  };

  return (
    <Surface level="raised" padding="lg">
      <Stack gap="lg">
        <Heading level={2} size="title-sm">
          New environment
        </Heading>
        <Form onSubmit={handleSubmit} validationErrors={serverErrors}>
          <TextField
            label="Name"
            name="name"
            isRequired
            validate={validateEnvironmentName}
            description="Used in deploy URLs: name--northline.meridian.app."
          />
          <RadioGroup
            label="Type"
            name="type"
            isRequired
            contextualHelp={
              <ContextualHelp aria-label="About environment types">
                <Heading level={3} size="title-sm">
                  Environment types
                </Heading>
                <Text>
                  Production serves live traffic and requires review when the
                  workspace says so. Staging mirrors production for rehearsal.
                  Preview environments deploy every branch and are torn down
                  when the branch merges.
                </Text>
              </ContextualHelp>
            }
          >
            <Radio value="production">Production</Radio>
            <Radio value="staging">Staging</Radio>
            <Radio value="preview">Preview</Radio>
          </RadioGroup>
          <TextField
            label="Branch"
            name="branch"
            isRequired
            defaultValue="main"
            description="Deploys run from this branch."
          />
          <NumberField
            label="Instances"
            name="instances"
            isRequired
            minValue={1}
            maxValue={16}
            defaultValue={2}
            description="Instances the environment keeps warm."
          />
          <Slider
            label="Scale up at CPU"
            value={cpuTarget}
            onChange={(value) => {
              setCpuTarget(value);
            }}
            minValue={0.4}
            maxValue={0.95}
            step={0.05}
            formatOptions={{ style: 'percent' }}
          />
          <CheckboxGroup
            label="Notify on"
            name="notifications"
            defaultValue={['failed']}
            description="Deploy events posted to the workspace channel."
          >
            <Checkbox value="started">{EVENT_LABELS.started}</Checkbox>
            <Checkbox value="succeeded">{EVENT_LABELS.succeeded}</Checkbox>
            <Checkbox value="failed">{EVENT_LABELS.failed}</Checkbox>
            <Checkbox value="rolled-back">
              {EVENT_LABELS['rolled-back']}
            </Checkbox>
          </CheckboxGroup>
          <FormActions>
            <Button evaluation="secondary" onPress={onDone}>
              Cancel
            </Button>
            <FormSubmit isPending={isPending}>
              {isPending ? 'Creating…' : 'Create environment'}
            </FormSubmit>
          </FormActions>
        </Form>
      </Stack>
    </Surface>
  );
};

const EnvironmentsTable = ({ query }: { query: string }) => {
  const { environments } = useWorkspace();
  const needle = query.trim().toLowerCase();
  const rows = environments.filter((environment) => {
    return (
      needle === '' ||
      environment.name.toLowerCase().includes(needle) ||
      environment.branch.toLowerCase().includes(needle)
    );
  });

  if (rows.length === 0) {
    return <Text tone="muted">{`No environments match "${query}".`}</Text>;
  }

  return (
    <Table aria-label="Environments">
      <TableHeader>
        <TableColumn id="name" isRowHeader>
          Name
        </TableColumn>
        <TableColumn id="type">Type</TableColumn>
        <TableColumn id="branch">Branch</TableColumn>
        <TableColumn id="instances">Instances</TableColumn>
        <TableColumn id="notifications">Notify on</TableColumn>
      </TableHeader>
      <TableBody>
        {rows.map((environment) => {
          return (
            <TableRow key={environment.id} id={environment.id}>
              <TableCell>{environment.name}</TableCell>
              <TableCell>
                <Badge>{environment.type}</Badge>
              </TableCell>
              <TableCell>{environment.branch}</TableCell>
              <TableCell>{String(environment.instances)}</TableCell>
              <TableCell>
                {environment.notifications
                  .map((event) => {
                    return EVENT_LABELS[event];
                  })
                  .join(', ') || '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/**
 * Environments — where deploys land, and the forms plan's proving ground:
 * the list is filtered by a `SearchField`, and the create flow is the
 * complete form item I names.
 */
export const EnvironmentsPage = () => {
  const [query, setQuery] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  return (
    <Stack gap="xl">
      <Stack direction="horizontal" align="start" justify="between">
        <Stack gap="xs">
          <Heading level={1} size="headline-sm">
            Environments
          </Heading>
          <Text tone="muted">Where northline&apos;s deploys land.</Text>
        </Stack>
        {!isCreating && (
          <Button
            onPress={() => {
              setIsCreating(true);
            }}
          >
            New environment
          </Button>
        )}
      </Stack>
      <SearchField
        aria-label="Filter environments"
        placeholder="Filter by name or branch"
        clearLabel="Clear filter"
        value={query}
        onChange={setQuery}
      />
      <EnvironmentsTable query={query} />
      {isCreating && (
        <NewEnvironmentForm
          onDone={() => {
            setIsCreating(false);
          }}
        />
      )}
    </Stack>
  );
};
