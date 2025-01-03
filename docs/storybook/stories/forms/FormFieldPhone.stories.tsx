import { action } from '@storybook/addon-actions';
import { Meta, Story } from '@storybook/react';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldPhone } from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';

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
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPhone name="phone" label="Telefone:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPhone name="phoneDisabled" label="Telefone:" disabled />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPhone
          name="phoneWarning"
          label="Telefone:"
          warning={true}
          warningMessage="WARNING"
        />
      </Flex>

      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
