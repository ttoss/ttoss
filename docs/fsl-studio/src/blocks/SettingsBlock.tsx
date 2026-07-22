import { zodResolver } from '@hookform/resolvers/zod';
import {
  Badge,
  Button,
  ConfirmationDialog,
  Dialog,
  DialogActions,
  DialogHeading,
  DialogModal,
  DialogTrigger,
  Form,
  FormSubmit,
  Heading,
  Select,
  SelectItem,
  type SortDescriptor,
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
  TextFieldControl,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/fsl-ui';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { toastQueue } from '../app/toasts';

const ROLES = ['admin', 'editor', 'viewer'] as const;

type Role = (typeof ROLES)[number];

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const INITIAL_MEMBERS: Member[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@ttoss.dev', role: 'admin' },
  {
    id: 'grace',
    name: 'Grace Hopper',
    email: 'grace@ttoss.dev',
    role: 'editor',
  },
  { id: 'alan', name: 'Alan Turing', email: 'alan@ttoss.dev', role: 'viewer' },
];

const inviteSchema = z.object({
  name: z.string().min(2, 'Enter the member name'),
  email: z.email('Enter a valid email address'),
  role: z.enum(ROLES, { message: 'Choose a role' }),
});

type InviteValues = z.infer<typeof inviteSchema>;

/**
 * The invite form lives in its own component so the dialog unmount resets
 * the form state for free. Select has no validation-message part (friction
 * F-009), so the role error is a hand-assembled live-region Text.
 */
const InviteForm = ({
  onInvite,
  close,
}: {
  onInvite: (values: InviteValues) => void;
  close: () => void;
}) => {
  const { control, handleSubmit } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', email: '' },
  });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit((values) => {
          onInvite(values);
          close();
        })(event);
      }}
    >
      <Stack gap="md">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => {
            return (
              <TextField
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
              >
                <TextFieldLabel>Name</TextFieldLabel>
                <TextFieldControl autoComplete="name" />
                {fieldState.error && (
                  <TextFieldError>{fieldState.error.message}</TextFieldError>
                )}
              </TextField>
            );
          }}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => {
            return (
              <TextField
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
              >
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldControl type="email" autoComplete="email" />
                {fieldState.error && (
                  <TextFieldError>{fieldState.error.message}</TextFieldError>
                )}
              </TextField>
            );
          }}
        />
        <Controller
          control={control}
          name="role"
          render={({ field, fieldState }) => {
            return (
              <Stack gap="xs">
                <Select
                  label="Role"
                  placeholder="Choose a role"
                  selectedKey={field.value ?? null}
                  onSelectionChange={(key) => {
                    field.onChange(String(key));
                  }}
                  isInvalid={fieldState.invalid}
                >
                  {ROLES.map((role) => {
                    return (
                      <SelectItem key={role} id={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    );
                  })}
                </Select>
                {fieldState.error && (
                  <Text variant="label-sm" role="alert">
                    {fieldState.error.message}
                  </Text>
                )}
              </Stack>
            );
          }}
        />
        <DialogActions>
          <Button composition="dismissAction" evaluation="muted" slot="close">
            Cancel
          </Button>
          <FormSubmit>Send invite</FormSubmit>
        </DialogActions>
      </Stack>
    </Form>
  );
};

/**
 * Block: a settings screen managing a team — sortable table, invite
 * (Create), and destructive removal (Delete). It proves the Table
 * composite (column alignment, sorting, rowheader semantics — friction
 * F-007's fix), the Dialog hosting a validated form, the
 * consequence-driven two-click destructive confirm, and Toast feedback.
 */
export const SettingsBlock = () => {
  const [members, setMembers] = React.useState<Member[]>(INITIAL_MEMBERS);
  const [sort, setSort] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });

  const sortedMembers = React.useMemo(() => {
    const key = sort.column === 'email' ? 'email' : 'name';
    const order = sort.direction === 'descending' ? -1 : 1;
    return [...members].sort((a, b) => {
      return a[key].localeCompare(b[key]) * order;
    });
  }, [members, sort]);

  const invite = (values: InviteValues) => {
    setMembers((current) => {
      return [
        ...current,
        { id: `${values.email}-${current.length}`, ...values },
      ];
    });
    toastQueue.add(
      {
        title: 'Invitation sent',
        description: values.email,
        evaluation: 'positive',
      },
      { timeout: 5000 }
    );
  };

  const remove = (member: Member) => {
    setMembers((current) => {
      return current.filter((candidate) => {
        return candidate.id !== member.id;
      });
    });
    toastQueue.add(
      { title: 'Member removed', description: member.name },
      { timeout: 5000 }
    );
  };

  return (
    <Surface level="raised" padding="lg">
      <Stack gap="lg">
        <Stack direction="horizontal" gap="md" align="center" justify="between">
          <Stack gap="xs">
            <Heading level={4} size="title-sm">
              Team members
            </Heading>
            <Text variant="body-sm" tone="muted">
              Invite teammates and manage their roles.
            </Text>
          </Stack>
          <DialogTrigger>
            <Button>Invite member</Button>
            <DialogModal>
              <Dialog>
                {({ close }) => {
                  return (
                    <Stack gap="md">
                      <DialogHeading>Invite member</DialogHeading>
                      <InviteForm onInvite={invite} close={close} />
                    </Stack>
                  );
                }}
              </Dialog>
            </DialogModal>
          </DialogTrigger>
        </Stack>
        <Table
          aria-label="Team members"
          sortDescriptor={sort}
          onSortChange={setSort}
        >
          <TableHeader>
            <TableColumn id="name" isRowHeader allowsSorting>
              Name
            </TableColumn>
            <TableColumn id="email" allowsSorting>
              Email
            </TableColumn>
            <TableColumn id="role">Role</TableColumn>
            <TableColumn id="actions">Actions</TableColumn>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((member) => {
              return (
                <TableRow key={member.id} id={member.id}>
                  <TableCell>
                    <Text as="span" variant="label-md">
                      {member.name}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text as="span" variant="body-sm" tone="muted">
                      {member.email}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge>{ROLE_LABEL[member.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <ConfirmationDialog
                      trigger={
                        <Button evaluation="muted" consequence="destructive">
                          Remove
                        </Button>
                      }
                      title={`Remove ${member.name}?`}
                      confirmLabel="Remove"
                      armedLabel="Click again to remove"
                      cancelLabel="Cancel"
                      consequence="destructive"
                      evaluation="negative"
                      onConfirm={() => {
                        remove(member);
                      }}
                    >
                      They will immediately lose access to the workspace.
                    </ConfirmationDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Stack>
    </Surface>
  );
};
