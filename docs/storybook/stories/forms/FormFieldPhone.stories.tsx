import { Meta, Story } from '@storybook/react-webpack5';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldPhone } from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldPhone',
  component: FormFieldPhone,
} as Meta;

const schema = yup.object({
  phone: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('phone', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldPhone name="phone" label="Telefone:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldPhone name="phoneDisabled" label="Telefone:" disabled />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldPhone
          name="phoneWarning"
          label="Telefone:"
          warning="WARNING"
        />
      </Flex>

      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
