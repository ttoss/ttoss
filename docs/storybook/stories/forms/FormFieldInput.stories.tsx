import { Meta, Story } from '@storybook/react-webpack5';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

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

        <FormFieldInput
          name="warning"
          label="Warning"
          defaultValue={22}
          warning="WARNING"
        />

        <FormFieldInput
          name="email"
          label="Email with Icons"
          placeholder="user@example.com"
          leadingIcon="ant-design:mail-outlined"
          trailingIcon="ant-design:check-circle-outlined"
        />

        <FormFieldInput
          name="search"
          label="Search"
          placeholder="Search..."
          leadingIcon="ant-design:search-outlined"
        />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
