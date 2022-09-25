import * as yup from 'yup';
import { Button } from '@ttoss/ui';
import { Form, FormField } from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

export default {
  title: 'Forms/FormField.Input',
  component: FormField.Input,
} as Meta;

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  age: yup.number().required('Age is required'),
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
      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Example = Template.bind({});
