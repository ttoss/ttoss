import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldCEP } from '@ttoss/forms/brazil';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldCEP',
  component: FormFieldCEP,
} as Meta;

const schema = yup.object({
  cep: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cep', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCEP name="cep" label="CEP:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCEP name="cepDisabled" label="CEP:" disabled />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
