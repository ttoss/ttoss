import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import {
  Form,
  FormFieldPatternFormat,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormFieldPatterFormat',
  component: FormFieldPatternFormat,
} as Meta;

const schema = yup.object({
  CreditcardNumber: yup.string().required('Value is required'),
  document: yup.string().required('Value is required'),
  cnpj: yup.string().required('Value is required'),
});

const Template: Story = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('CreditcardNumber', { message: 'Value is required' });
    formMethods.setError('document', { message: 'Value is required' });
    formMethods.setError('cnpj', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPatternFormat
          name="CreditcardNumber"
          label="Numero do cartão:"
          format="#### #### #### ####"
          placeholder="1234 1234 1234 1234"
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPatternFormat
          name="document"
          label="CPF:"
          format="###.###.###-##"
          placeholder="123.456.789-00"
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPatternFormat
          name="cnpj"
          label="CNPJ:"
          format="##.###.###/####-##"
          placeholder="12.345.678/0000-00"
        />
      </Flex>

      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldPatternFormat
          name="cnpj"
          label="CNPJ:"
          format="##.###.###/####-##"
          placeholder="12.345.678/0000-00"
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
