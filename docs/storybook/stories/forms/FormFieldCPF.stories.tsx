import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldCPF } from '@ttoss/forms/brazil';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormFieldCPF',
  component: FormFieldCPF,
} as Meta;

const schema = yup.object().shape({
  cpf: yup.string().required('value is required').cpf(),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cpf', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCPF name="cpf" label="CPF:" />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCPF name="cpfDisabled" label="CPF:" disabled />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCPF name="cpfWarning" label="CPF:" warning={true} />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
