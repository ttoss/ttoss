import * as yup from 'yup';
import { Button } from '@ttoss/ui';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  yupResolver,
} from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useForm } from 'react-hook-form';
import alertIcon from '@iconify-icons/mdi-light/alert';

export default {
  title: 'Forms/Form',
  component: Form,
} as Meta;

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  age: yup.number().required('Age is required'),
  receiveEmails: yup.boolean(),
  version: yup.string().required('Version is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      version: 'v15',
    },
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldInput
        name="firstName"
        label="First Name"
        trailingIcon={alertIcon}
        leadingIcon="ic:baseline-supervised-user-circle"
        tooltipIcon="ic:baseline-supervised-user-circle"
        showCharacterCounter
      />
      <FormFieldInput
        tooltipIcon={alertIcon}
        name="age"
        label="Age"
        type="number"
      />
      <FormFieldCheckbox name="receiveEmails" label="Receive Emails" />
      <FormFieldInput name="version" label="Version (disabled)" disabled />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Example = Template.bind({});
