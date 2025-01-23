import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  Form,
  FormFieldCurrencyInput,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'Forms/FormFieldCurrencyInput',
  component: FormFieldCurrencyInput,
} as Meta;

const schema = yup.object({
  real: yup.string().required('Value is required'),
  dolar: yup.string().required('Value is required'),
  euro: yup.string().required('Value is required'),
});

const Template: StoryFn = () => {
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCurrencyInput
          tooltip={'Currency input '}
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

      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
