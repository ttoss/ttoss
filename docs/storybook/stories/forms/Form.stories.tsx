import * as yup from 'yup';
import { Button } from '@ttoss/ui';
import { Form, FormField, yupResolver } from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useForm } from 'react-hook-form';

export default {
  title: 'Forms/Form',
  component: Form,
} as Meta;

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  age: yup.number().required('Age is required'),
  receiveEmails: yup.boolean(),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormField.Input name="firstName" label="First Name" />
      <FormField.Input name="age" label="Age" />
      <FormField.Checkbox name="receiveEmails" label="Receive Emails" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Example = Template.bind({});
