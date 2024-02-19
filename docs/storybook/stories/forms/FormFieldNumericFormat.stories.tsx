import * as React from 'react';
import { Button, Flex } from '@ttoss/ui/src';
import {
  Form,
  FormFieldNumericFormat,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldNumericFormat',
  component: FormFieldNumericFormat,
} as Meta;

const schema = yup.object({
  real: yup.string().required('Value is required'),
  dolar: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('real', { message: 'Value is required' });
    formMethods.setError('dolar', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldNumericFormat
          name="real"
          label="Real"
          thousandSeparator=","
          decimalSeparator="."
          fixedDecimalScale
          decimalScale={2}
          prefix="R$ "
          placeholder="R$ 00,00"
          allowNegative={false}
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldNumericFormat
          name="dolar"
          label="Dolar"
          thousandSeparator=","
          decimalSeparator="."
          fixedDecimalScale
          decimalScale={2}
          prefix="$ "
          placeholder="$ 00,00"
          allowNegative={false}
        />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldNumericFormat
          name="dolar"
          label="Dolar"
          thousandSeparator=","
          decimalSeparator="."
          fixedDecimalScale
          decimalScale={2}
          prefix="$ "
          placeholder="$ 00,00"
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
