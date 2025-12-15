import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import {
  FormFieldCPFOrCNPJ,
  isCnpjValid,
  isCpfValid,
} from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldCPFOrCNPJ',
  component: FormFieldCPFOrCNPJ,
} as Meta;

const schema = yup.object().shape({
  cpfOrCnpj: yup
    .string()
    .required('Value is required')
    .test('cpf-or-cnpj', 'Invalid CPF or CNPJ', (value) => {
      if (!value) {
        return false;
      }
      return isCpfValid(value) || isCnpjValid(value);
    }),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cpfOrCnpj', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCPFOrCNPJ name="cpfOrCnpj" label="CPF or CNPJ:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCPFOrCNPJ
          name="cpfOrCnpjDisabled"
          label="CPF or CNPJ:"
          disabled
        />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCPFOrCNPJ
          name="cpfOrCnpjWarning"
          label="CPF or CNPJ:"
          warning={true}
        />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
