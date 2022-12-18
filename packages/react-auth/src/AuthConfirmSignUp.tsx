import { AuthCard } from './AuthCard';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { useI18n } from '@ttoss/react-i18n';
import type { OnConfirmSignUp } from './types';

export const AuthConfirmSignUp = ({
  email,
  onConfirmSignUp,
}: {
  email: string;
  onConfirmSignUp: OnConfirmSignUp;
}) => {
  const { intl } = useI18n();

  const schema = yup
    .object()
    .shape({
      code: yup
        .string()
        .required(
          intl.formatMessage({
            description: 'Required field.',
            defaultMessage: 'Required field',
          })
        )
        .max(
          6,
          intl.formatMessage(
            {
              description: 'Minimum {value} characters.',
              defaultMessage: 'Minimum {value} characters',
            },
            { value: 6 }
          )
        ),
    })
    .required();

  const formMethods = useForm<yup.TypeOf<typeof schema>>({
    resolver: yupResolver(schema),
  });

  return (
    <Form
      {...formMethods}
      onSubmit={({ code }) => {
        return onConfirmSignUp({ code, email });
      }}
    >
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Confirm',
          defaultMessage: 'Confirm',
        })}
        title={intl.formatMessage({
          description: 'Confirmation',
          defaultMessage: 'Confirmation',
        })}
      >
        <FormFieldInput
          name="code"
          label={intl.formatMessage({
            description: 'Sign up confirmation code',
            defaultMessage: 'Code',
          })}
        />
      </AuthCard>
    </Form>
  );
};
