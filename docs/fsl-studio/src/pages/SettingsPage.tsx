import {
  Checkbox,
  ComboBox,
  ComboBoxItem,
  ContextualHelp,
  Form,
  FormActions,
  FormSubmit,
  Heading,
  Select,
  SelectItem,
  Separator,
  Stack,
  Surface,
  Switch,
  Text,
  TextArea,
  TextField,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { TIMEZONES } from '../data';
import { saveSettings, useWorkspace } from '../store';
import { toasts } from '../toasts';
import { formText, validateSlug } from './SettingsPage.helpers';

/** Where the workspace's infrastructure runs. */
const REGIONS = [
  ['eu-west', 'Europe (Lisbon)'],
  ['us-east', 'US East (Virginia)'],
  ['ap-south', 'Asia Pacific (Singapore)'],
] as const;

/**
 * Workspace settings — the surface that pulled `labelPosition="side"` in.
 *
 * A settings form is wide and multi-row, which is the only shape where side
 * labels earn their keep: the labels share one column, so every control starts at
 * the same x and the form reads as a table of properties rather than a stack of
 * stacks. On a narrow form (the login card, the invite dialog) they would be
 * strictly worse, which is why this is a Form-level decision and both shapes ship.
 */
const WorkspaceForm = () => {
  const { settings } = useWorkspace();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveSettings({
      name: formText(data, 'name'),
      slug: formText(data, 'slug'),
      region: formText(data, 'region'),
      // Empty when the member clears the ComboBox without picking a zone — the
      // one fallback here that a user can actually reach.
      timezone: formText(data, 'timezone') || settings.timezone,
      description: formText(data, 'description'),
      requireReview: data.get('requireReview') !== null,
      enforceTwoFactor: data.get('enforceTwoFactor') !== null,
    });
    toasts.add({ title: 'Workspace settings saved' }, { timeout: 4000 });
  };

  return (
    <Surface level="raised" padding="lg">
      <Form labelPosition="side" onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          defaultValue={settings.name}
          isRequired
          description="Shown in the workspace switcher and on invitations."
        />
        <TextField
          label="Slug"
          name="slug"
          defaultValue={settings.slug}
          isRequired
          validate={validateSlug}
          description="Used in deploy URLs."
        />
        <Select
          label="Region"
          name="region"
          defaultSelectedKey={settings.region}
          // The explanation is too long for a description line and matters
          // too rarely to spend the space permanently — the contextualHelp
          // criterion (forms B4).
          contextualHelp={
            <ContextualHelp aria-label="About regions">
              <Heading level={2} size="title-sm">
                Choosing a region
              </Heading>
              <Text>
                Deploys run in this region. Changing it schedules a data
                migration on the next deploy — in-flight deploys finish where
                they started.
              </Text>
            </ContextualHelp>
          }
        >
          {REGIONS.map(([id, label]) => {
            return (
              <SelectItem key={id} id={id}>
                {label}
              </SelectItem>
            );
          })}
        </Select>
        <ComboBox
          label="Timezone"
          name="timezone"
          defaultSelectedKey={settings.timezone}
          placeholder="Type a city"
        >
          {TIMEZONES.map((zone) => {
            return (
              <ComboBoxItem key={zone.id} id={zone.id}>
                {zone.label}
              </ComboBoxItem>
            );
          })}
        </ComboBox>
        <TextArea
          label="Description"
          name="description"
          defaultValue={settings.description}
          rows={3}
        />
        {/*
          A Checkbox keeps its label in its own row — there was never a label
          stacked above the control to move — but it still takes the control
          column, so it lines up with the fields. It is here on purpose: a settings
          form mixes both shapes, and this row is where that reads either well or
          badly. It read badly first: the row landed in the label column and shared
          a grid line with Save changes, looking like its caption.
        */}
        <Checkbox name="requireReview" defaultSelected={settings.requireReview}>
          Require a review before deploying to production
        </Checkbox>
        {/*
          A Switch beside a Checkbox on purpose: the checkbox states a rule the
          workspace opts into, the switch flips a live enforcement — and this
          one carries the field envelope its SwitchField root restored (forms
          item E): the description is real supporting copy, linked via
          aria-describedby, not a second label.
        */}
        <Switch
          name="enforceTwoFactor"
          defaultSelected={settings.enforceTwoFactor}
          description="Members without a second factor are signed out at the next deploy."
        >
          Enforce two-factor authentication
        </Switch>
        <FormActions>
          <FormSubmit>Save changes</FormSubmit>
        </FormActions>
      </Form>
    </Surface>
  );
};

/** Settings — the workspace's own properties, edited in a wide form. */
export const SettingsPage = () => {
  const { settings } = useWorkspace();

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Heading level={1} size="headline-sm">
          Settings
        </Heading>
        <Text tone="muted">
          {`How the ${settings.name} workspace behaves.`}
        </Text>
      </Stack>
      <Separator />
      <WorkspaceForm />
    </Stack>
  );
};
