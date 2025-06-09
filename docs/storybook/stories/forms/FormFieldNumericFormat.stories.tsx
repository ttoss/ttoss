import { action } from '@storybook/addon-actions';
import { Meta, Story } from '@storybook/react';
import {
  Form,
  FormFieldNumericFormat,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex } from '@ttoss/ui';
import * as React from 'react';

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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
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
          feedbackMessage="WARNING"
        />
      </Flex>

      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
