import type { SortDescriptor } from '@ttoss/fsl-ui';
import {
  Badge,
  Button,
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
import { inviteMember, removeMember, useWorkspace } from '../store';
import { toasts } from '../toasts';
import { validateEmail } from './LoginPage';

const InviteDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '');
    const role = String(data.get('role') ?? 'Developer') as Role;
    inviteMember({ email, role });
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
                <TextField name="email" type="email" validate={validateEmail}>
                  <TextFieldLabel>Email</TextFieldLabel>
                  <TextFieldControl />
                  <TextFieldError />
                </TextField>
                <Select label="Role" name="role" defaultSelectedKey="Developer">
                  <SelectItem id="Admin">Admin</SelectItem>
                  <SelectItem id="Developer">Developer</SelectItem>
                  <SelectItem id="Viewer">Viewer</SelectItem>
                </Select>
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

const RemoveMemberAction = ({ member }: { member: Member }) => {
  return (
    <ConfirmationDialog
      trigger={<Button evaluation="muted">Remove</Button>}
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
                {/*
                 * Descriptive role chip — the recorded F-010 pattern: Badge
                 * with the neutral `primary` evaluation until a descriptive
                 * Tag primitive exists.
                 */}
                <Badge>{member.role}</Badge>
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
