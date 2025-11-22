import { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  NotificationsBox,
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications';
import { Box, Button, Heading, Stack, Text } from '@ttoss/ui';

export default {
  title: 'React Notifications/NotificationsBox',
  decorators: [
    (Story) => {
      return (
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      );
    },
  ],
} as Meta;

export const BasicUsage: StoryFn = () => {
  const { addNotification } = useNotifications();

  return (
    <Stack sx={{ gap: '4' }}>
      <Heading>Basic NotificationsBox</Heading>
      <Text>
        Click the buttons to add notifications. They will appear in the box
        below.
      </Text>

      <Stack sx={{ gap: '2', flexDirection: 'row' }}>
        <Button
          onClick={() => {
            addNotification({
              message: 'This is an info notification',
              type: 'info',
            });
          }}
        >
          Add Info
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'This is a success notification',
              type: 'success',
            });
          }}
        >
          Add Success
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'This is a warning notification',
              type: 'warning',
            });
          }}
        >
          Add Warning
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'This is an error notification',
              type: 'error',
            });
          }}
        >
          Add Error
        </Button>
      </Stack>

      <Box
        sx={{
          padding: '4',
          borderWidth: '1',
          borderColor: 'gray.300',
          borderRadius: 'md',
        }}
      >
        <NotificationsBox />
      </Box>
    </Stack>
  );
};

export const WithTitles: StoryFn = () => {
  const { addNotification } = useNotifications();

  return (
    <Stack sx={{ gap: '4' }}>
      <Heading>Notifications with Titles</Heading>
      <Text>Notifications can include optional titles for more context.</Text>

      <Stack sx={{ gap: '2', flexDirection: 'row' }}>
        <Button
          onClick={() => {
            addNotification({
              title: 'System Update',
              message: 'A new version is available for download',
              type: 'info',
            });
          }}
        >
          Add with Title
        </Button>
        <Button
          onClick={() => {
            addNotification({
              title: 'Save Complete',
              message: 'Your changes have been saved successfully',
              type: 'success',
            });
          }}
        >
          Success with Title
        </Button>
      </Stack>

      <Box
        sx={{
          padding: '4',
          borderWidth: '1',
          borderColor: 'gray.300',
          borderRadius: 'md',
        }}
      >
        <NotificationsBox />
      </Box>
    </Stack>
  );
};

export const MultipleBoxesWithIds: StoryFn = () => {
  const { addNotification } = useNotifications();

  return (
    <Stack sx={{ gap: '4' }}>
      <Heading>Multiple NotificationsBox with IDs</Heading>
      <Text>
        Use box IDs to show specific notifications in specific boxes. Click the
        buttons to send notifications to different boxes.
      </Text>

      <Stack sx={{ gap: '2', flexDirection: 'row' }}>
        <Button
          onClick={() => {
            addNotification({
              message: 'Notification for Box 1',
              type: 'info',
              boxId: 'box-1',
            });
          }}
        >
          Send to Box 1
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'Notification for Box 2',
              type: 'success',
              boxId: 'box-2',
            });
          }}
        >
          Send to Box 2
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'Notification for default box (no boxId)',
              type: 'warning',
            });
          }}
        >
          Send to Default Box
        </Button>
      </Stack>

      <Stack sx={{ gap: '4' }}>
        <Box>
          <Heading as="h3" sx={{ fontSize: 'lg', marginBottom: '2' }}>
            {'Box 1 (id="box-1")'}
          </Heading>
          <Box
            sx={{
              padding: '4',
              borderWidth: '1',
              borderColor: 'blue.300',
              borderRadius: 'md',
            }}
          >
            <NotificationsBox id="box-1" />
          </Box>
        </Box>

        <Box>
          <Heading as="h3" sx={{ fontSize: 'lg', marginBottom: '2' }}>
            {'Box 2 (id="box-2")'}
          </Heading>
          <Box
            sx={{
              padding: '4',
              borderWidth: '1',
              borderColor: 'green.300',
              borderRadius: 'md',
            }}
          >
            <NotificationsBox id="box-2" />
          </Box>
        </Box>

        <Box>
          <Heading as="h3" sx={{ fontSize: 'lg', marginBottom: '2' }}>
            Default Box (no id)
          </Heading>
          <Box
            sx={{
              padding: '4',
              borderWidth: '1',
              borderColor: 'gray.300',
              borderRadius: 'md',
            }}
          >
            <NotificationsBox />
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
};

export const DirectNotifications: StoryFn = () => {
  const directNotifications = [
    {
      id: 'direct-1',
      message: 'This notification is passed directly via props',
      type: 'info' as const,
    },
    {
      id: 'direct-2',
      title: 'Direct Notification',
      message: 'Not managed by the global notification state',
      type: 'success' as const,
    },
    {
      id: 'direct-3',
      title: 'Static Warning',
      message: 'Useful for displaying static or pre-defined notifications',
      type: 'warning' as const,
    },
  ];

  return (
    <Stack sx={{ gap: '4' }}>
      <Heading>Direct Notifications</Heading>
      <Text>
        Notifications can be passed directly via the `notifications` prop,
        bypassing the global notification state.
      </Text>

      <Box
        sx={{
          padding: '4',
          borderWidth: '1',
          borderColor: 'gray.300',
          borderRadius: 'md',
        }}
      >
        <NotificationsBox notifications={directNotifications} />
      </Box>
    </Stack>
  );
};

export const MixedViewTypes: StoryFn = () => {
  const { addNotification } = useNotifications();

  return (
    <Stack sx={{ gap: '4' }}>
      <Heading>Mixed View Types</Heading>
      <Text>
        {`NotificationsBox only shows notifications with viewType='box' (or when defaultViewType is 'box' and no viewType is specified). Other view types like 'modal', 'toast', and 'header' are handled by their respective components.`}
      </Text>

      <Stack sx={{ gap: '2', flexDirection: 'row' }}>
        <Button
          onClick={() => {
            addNotification({
              message: 'Box notification (will appear below)',
              type: 'info',
              viewType: 'box',
            });
          }}
        >
          Add Box
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'Toast notification (handled by ToastContainer)',
              type: 'success',
              viewType: 'toast',
            });
          }}
        >
          Add Toast
        </Button>
        <Button
          onClick={() => {
            addNotification({
              message: 'Modal notification (handled by NotificationsModal)',
              type: 'warning',
              viewType: 'modal',
            });
          }}
        >
          Add Modal
        </Button>
      </Stack>

      <Box>
        <Heading as="h3" sx={{ fontSize: 'lg', marginBottom: '2' }}>
          NotificationsBox (only shows box notifications)
        </Heading>
        <Box
          sx={{
            padding: '4',
            borderWidth: '1',
            borderColor: 'gray.300',
            borderRadius: 'md',
          }}
        >
          <NotificationsBox />
        </Box>
      </Box>
    </Stack>
  );
};
