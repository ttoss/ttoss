import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Form, FormFieldCNPJ, useForm, yup, yupResolver } from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldCNPJ',
  component: FormFieldCNPJ,
} as Meta;

const schema = yup.object({
  cnpj: yup.string().required('Value is required'),
  cnpjdisabled: yup.string(),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cnpj', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCNPJ name="cnpj" label="CNPJ:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCNPJ name="cnpjdisabled" label="CNPJ:" disabled />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
