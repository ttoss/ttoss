import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldCNPJ } from '@ttoss/forms/brazil';
import { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldCNPJ',
  component: FormFieldCNPJ,
} as Meta;

const schema = yup.object().shape({
  cnpj: yup.string().required('value is required').cnpj(),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cnpj', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCNPJ name="cnpj" label="CNPJ:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCNPJ name="cnpjDisabled" label="CNPJ:" disabled />
      </Flex>
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
