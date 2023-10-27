import * as React from 'react';
import { Button, Flex } from '@ttoss/ui/src';
import {
  Form,
  FormFieldCreditCardNumber,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms/src';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldCreditCardNumber',
  component: FormFieldCreditCardNumber,
} as Meta;

const schema = yup.object({
  cartao1: yup.string().required('Value is required'),
  cartao2: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cartao1', { message: 'Value is required' });
    formMethods.setError('cartao2', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCreditCardNumber name="cartao1" label="cartao 1" />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCreditCardNumber name="cartao2" label="cartao 2" />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCreditCardNumber
          name="cartao3"
          label="cartao desativado"
          disabled
        />
      </Flex>

      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
