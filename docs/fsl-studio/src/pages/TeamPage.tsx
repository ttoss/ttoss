import type { SortDescriptor } from '@ttoss/fsl-ui';
import {
  Badge,
  Button,
  Checkbox,
  ComboBox,
  ComboBoxItem,
  ConfirmationDialog,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
  Form,
  FormSubmit,
  Heading,
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  TextField,
  TextFieldControl,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import type { Member, Role } from '../data';
import { timezoneLabel, TIMEZONES } from '../data';
import { inviteMember, removeMember, useWorkspace } from '../store';
import { toasts } from '../toasts';
import { validateEmail } from './LoginPage';

/** Where northline is headquartered — the invite form's starting zone. */
const DEFAULT_TIMEZONE = 'Europe/Lisbon';

const InviteDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '');
    const role = String(data.get('role') ?? 'Developer') as Role;
    // Empty when the member clears the ComboBox without picking a zone.
    const timezone = String(data.get('timezone') || DEFAULT_TIMEZONE);
    inviteMember({ email, role, timezone });
    setIsOpen(false);
    toasts.add({ title: `Invitation sent to ${email}` }, { timeout: 4000 });
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button>Invite member</Button>
      <DialogModal>
        <Dialog aria-label="Invite member">
          <DialogHeading>Invite member</DialogHeading>
          <Form onSubmit={handleSubmit}>
            <DialogBody>
              <Stack gap="md">
                {/*
                  Left in slot form on purpose: the necessity marker has to look
                  identical whichever way a field is authored, and this is the
                  composed side of that pair standing in a real flow.
                */}
                <TextField
                  name="email"
                  type="email"
                  isRequired
                  validate={validateEmail}
                >
                  <TextFieldLabel>Email</TextFieldLabel>
                  <TextFieldControl />
                  <TextFieldError />
                </TextField>
                {/*
                  The role is now chosen rather than defaulted. It used to
                  default to Developer, which meant an invite could silently
                  grant deploy access to someone nobody picked a role for — and
                  the field had no way to insist, because until F-009 closed a
                  Select could only turn red without saying why.
                */}
                <Select
                  label="Role"
                  name="role"
                  isRequired
                  placeholder="Choose a role"
                  description="Admins manage billing and members; Viewers are read-only."
                >
                  <SelectItem id="Admin">Admin</SelectItem>
                  <SelectItem id="Developer">Developer</SelectItem>
                  <SelectItem id="Viewer">Viewer</SelectItem>
                </Select>
                {/*
                 * The field F-008 recorded as dropped: 35 zones are scan-only
                 * in a Select popover, so it waited for ComboBox's typeahead.
                 * Role stays a Select — three options is its correct scale.
                 */}
                {/*
                  The confirmation-checkbox shape: a required box that can state
                  its own rule. Before the Checkbox envelope it could only turn
                  red (F-033), which is why the dialog had no such gate.
                */}
                <Checkbox
                  name="acknowledge"
                  isRequired
                  description="Members can deploy to production immediately after accepting."
                  errorMessage="Confirm you understand the access this grants."
                >
                  I understand this grants deploy access
                </Checkbox>
                <ComboBox
                  label="Timezone"
                  name="timezone"
                  defaultSelectedKey={DEFAULT_TIMEZONE}
                  description="Deploy timestamps are shown in this zone."
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
              </Stack>
            </DialogBody>
            <DialogActions>
              <Button
                composition="secondaryAction"
                evaluation="secondary"
                onPress={() => {
                  setIsOpen(false);
                }}
              >
                Cancel
              </Button>
              <FormSubmit>Send invite</FormSubmit>
            </DialogActions>
          </Form>
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

/**
 * The row trigger is a *peer* of the other cells, so it keeps the quiet rung
 * and says what it does through `consequence` — the ink turns, the fill does
 * not (F-029). Filling it red would make every row shout. The confirm button
 * inside the dialog is the opposite case and is authored that way: there, the
 * destructive command is the loud one on the surface.
 */
const RemoveMemberAction = ({ member }: { member: Member }) => {
  return (
    <ConfirmationDialog
      trigger={
        <Button evaluation="muted" consequence="destructive">
          Remove
        </Button>
      }
      title={`Remove ${member.name} from northline?`}
      confirmLabel="Remove member"
      armedLabel="Click again to confirm"
      cancelLabel="Cancel"
      consequence="destructive"
      evaluation="negative"
      onConfirm={() => {
        removeMember({ id: member.id });
        toasts.add(
          { title: `${member.name} removed from the workspace` },
          { timeout: 4000 }
        );
      }}
    />
  );
};

const sortMembers = (members: Member[], descriptor: SortDescriptor) => {
  const sorted = [...members].sort((a, b) => {
    switch (descriptor.column) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'role':
        return a.role.localeCompare(b.role);
      default:
        return 0;
    }
  });
  return descriptor.direction === 'descending' ? sorted.reverse() : sorted;
};

const MembersTable = ({ members }: { members: Member[] }) => {
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const sorted = sortMembers(members, sortDescriptor);

  return (
    <Table
      aria-label="Team members"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        <TableColumn id="name" isRowHeader allowsSorting>
          Member
        </TableColumn>
        <TableColumn id="email">Email</TableColumn>
        <TableColumn id="role" allowsSorting>
          Role
        </TableColumn>
        <TableColumn id="timezone">Timezone</TableColumn>
        <TableColumn id="joined">Joined</TableColumn>
        <TableColumn id="actions">Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {sorted.map((member) => {
          return (
            <TableRow key={member.id} id={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>
                <Text variant="body-sm" tone="muted">
                  {member.email}
                </Text>
              </TableCell>
              <TableCell>
                {/* Descriptive role chip — a role is not an outcome (F-010). */}
                <Badge>{member.role}</Badge>
              </TableCell>
              <TableCell>
                <Text variant="body-sm" tone="muted">
                  {timezoneLabel(member.timezone)}
                </Text>
              </TableCell>
              <TableCell>{member.joined}</TableCell>
              <TableCell>
                <RemoveMemberAction member={member} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/** Team — the settings/CRUD flow: roster, invite, remove. */
export const TeamPage = () => {
  const { members } = useWorkspace();

  return (
    <Stack gap="xl">
      <Stack direction="horizontal" align="end" justify="between">
        <Stack gap="xs">
          <Heading level={1} size="headline-sm">
            Team
          </Heading>
          <Text tone="muted">
            Manage who can access the northline workspace.
          </Text>
        </Stack>
        <InviteDialog />
      </Stack>
      <Stack gap="sm">
        <Text variant="label-sm" tone="muted" numeric="tabular">
          {`${members.length} members`}
        </Text>
        <MembersTable members={members} />
      </Stack>
    </Stack>
  );
};
