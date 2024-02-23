import * as React from 'react';
import { Button, Flex } from '@ttoss/ui/src';
import {
  Form,
  FormFieldCurrencyInput,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldCurrencyInput',
  component: FormFieldCurrencyInput,
} as Meta;

const schema = yup.object({
  real: yup.string().required('Value is required'),
  dolar: yup.string().required('Value is required'),
  euro: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('real', { message: 'Value is required' });
    formMethods.setError('dolar', { message: 'Value is required' });
    formMethods.setError('euro', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCurrencyInput
          name="real"
          label="Real"
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          fixedDecimalScale
          decimalScale={2}
          allowNegative={false}
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCurrencyInput
          name="dolar"
          label="Dolar"
          prefix="$ "
          decimalSeparator="."
          thousandSeparator=","
          fixedDecimalScale
          decimalScale={2}
          allowNegative={false}
        />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCurrencyInput
          name="euro"
          label="Euro"
          prefix="€ "
          decimalSeparator=","
          thousandSeparator="."
          fixedDecimalScale
          decimalScale={2}
          allowNegative={false}
        />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCurrencyInput
          name="libra"
          label="Libra"
          prefix="£ "
          decimalSeparator=","
          thousandSeparator="."
          fixedDecimalScale
          decimalScale={2}
          allowNegative={false}
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
