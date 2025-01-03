import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldInput',
  component: FormFieldInput,
} as Meta;

const schema = yup.object({
  firstName: yup.string(),
  lastName: yup.string().required('Last name is required'),
  age: yup.number(),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('lastName', { message: 'Last name is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldInput
          name="firstName"
          label="First Name"
          placeholder="First Name"
        />

        <FormFieldInput name="lastName" label="Last Name" />

        <FormFieldInput disabled name="age" label="Age" defaultValue={22} />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
