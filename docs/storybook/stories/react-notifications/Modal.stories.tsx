import { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  FormFieldRadio,
  FormGroup,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import {
  NotificationsBox,
  NotificationsProvider,
  useNotifications,
} from '@ttoss/react-notifications';
import { Box, Button, Stack, Text } from '@ttoss/ui';

export default {
  title: 'React Notifications/Notifications',
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

const schema = yup.object().shape({
  title: yup.string(),
  message: yup.string().required(),
  type: yup.string().required(),
  viewType: yup.string().required(),
  boxId: yup.string(),
  persist: yup.string(),
});

export const Notifications: StoryFn = () => {
  const { addNotification, clearNotifications } = useNotifications();

  const formMethods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: 'Test',
      message: 'This is a test notification',
      type: 'info',
      viewType: 'box',
      boxId: '',
      persist: 'false',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (values: any) => {
    addNotification({
      title: values.title,
      message: values.message,
      type: values.type,
      viewType: values.viewType,
      boxId: values.boxId,
      persist: values.persist === 'true',
    });
  };

  return (
    <Stack sx={{ gap: '6' }}>
      <Box>
        <Text>Box without id</Text>
        <NotificationsBox />
      </Box>
      <Box>
        <Text>Box with id: box-1</Text>
        <NotificationsBox id="box-1" />
      </Box>
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormGroup>
          <FormFieldRadio
            name="viewType"
            label="View Type"
            options={[
              {
                label: 'Box',
                value: 'box',
              },
              {
                label: 'Modal',
                value: 'modal',
              },
              {
                label: 'Toast',
                value: 'toast',
              },
              {
                label: 'Header',
                value: 'header',
              },
            ]}
          />
          <FormFieldRadio
            name="boxId"
            label="Box ID"
            options={[
              {
                label: 'No Id',
                value: '',
              },
              {
                label: 'box-1',
                value: 'box-1',
              },
            ]}
          />
          <FormFieldRadio
            name="type"
            label="Type"
            options={[
              {
                label: 'Info',
                value: 'info',
              },
              {
                label: 'Warning',
                value: 'warning',
              },
              {
                label: 'Error',
                value: 'error',
              },
              {
                label: 'Success',
                value: 'success',
              },
            ]}
          />

          <FormFieldRadio
            name="persist"
            label="Persist"
            options={[
              {
                label: 'No',
                value: 'false',
              },
              {
                label: 'Yes',
                value: 'true',
              },
            ]}
          />

          <FormFieldInput name="title" label="Title" />
          <FormFieldInput name="message" label="Message" />
          <Button type="submit">Add Notification</Button>
          <Button onClick={clearNotifications}>Clear Notifications</Button>
        </FormGroup>
      </Form>
    </Stack>
  );
};
