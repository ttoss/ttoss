import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import { Form, useForm, yup, yupResolver } from '@ttoss/forms';
import { FormFieldCEP } from '@ttoss/forms/brazil';
import { Button, Flex, Link } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'Forms/FormFieldCEP',
  component: FormFieldCEP,
} as Meta;

const schema = yup.object({
  cep: yup.string().required('Value is required'),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    formMethods.setError('cep', { message: 'Value is required' });
  }, []);

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCEP
          name="cep"
          label="CEP:"
          warning={
            <Link
              sx={{
                color: 'feedback.text.caution.default',
                ':visited': {
                  color: 'feedback.text.caution.default',
                },
              }}
              href="https://www.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Saiba mais
            </Link>
          }
        />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <FormFieldCEP name="cepDisabled" label="CEP:" disabled />
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        <FormFieldCEP
          name="cepWarning"
          label="CEP:"
          warning={
            <div>
              {` Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy text
              ever since the 1500s, when an unknown printer took a galley of
              type and scrambled it to make a type specimen book. It has
              survived not only five centuries, but also the leap into
              electronic typesetting, remaining essentially unchanged. It was
              popularised in the 1960s with the release of Letraset sheets
              containing Lorem Ipsum passages,`}
              <br />
              {`and more recently with desktop publishing software like
              Aldus PageMaker including versions of Lorem Ipsum.`}
            </div>
          }
          warningMaxLines={1}
          warningTooltip={{
            place: 'right',
            openOnClick: true,
          }}
        />
      </Flex>
      <Button sx={{ marginTop: 'lg' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});
