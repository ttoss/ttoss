import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldCNPJ } from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

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
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCNPJ name="cnpjWarning" label="CNPJ:" warning={true} />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
