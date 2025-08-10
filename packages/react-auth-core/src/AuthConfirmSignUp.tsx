import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { useI18n } from '@ttoss/react-i18n';

import { AuthCard } from './AuthCard';
import type { OnConfirmSignUp } from './types';

export type AuthConfirmSignUpProps = {
  email: string;
  onConfirmSignUp: OnConfirmSignUp;
};

export const AuthConfirmSignUp = ({
  email,
  onConfirmSignUp,
}: AuthConfirmSignUpProps) => {
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

  const formMethods = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
  });

  return (
    <Form
      {...formMethods}
      onSubmit={({ code }: { code: string }) => {
        return onConfirmSignUp({ code, email });
      }}
    >
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Confirm',
          defaultMessage: 'Confirm',
        })}
        isValidForm={formMethods.formState.isValid}
        title={intl.formatMessage({
          description: 'Confirmation',
          defaultMessage: 'Confirmation',
        })}
      >
        <NotificationCard
          type="info"
          message={intl.formatMessage({
            defaultMessage:
              'We have sent a confirmation code to your email address. Please enter the code below.',
          })}
        />
        <FormFieldInput
          sx={{ marginTop: '6' }}
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
