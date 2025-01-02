import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { useI18n } from '@ttoss/react-i18n';
import { NotificationsBox } from '@ttoss/react-notifications';
import { Button, Link, Text } from '@ttoss/ui';

import { AuthCard } from './AuthCard';
import type { OnForgotPassword } from './types';

export type AuthForgotPasswordProps = {
  onForgotPassword: OnForgotPassword;
  onCancel: () => void;
  onSignUp: () => void;
};

export const AuthForgotPassword = ({
  onForgotPassword,
  onCancel,
  onSignUp,
}: AuthForgotPasswordProps) => {
  const { intl } = useI18n();

  const schema = yup
    .object()
    .shape({
      email: yup
        .string()
        .required(
          intl.formatMessage({
            description: 'Required field.',
            defaultMessage: 'Enter your email address',
          })
        )
        .email(
          intl.formatMessage({
            description: 'Please, insert a valid e-mail',
            defaultMessage: 'Please, insert a valid e-mail',
          })
        ),
    })
    .required();

  const formMethods = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  return (
    <Form
      {...formMethods}
      sx={{
        maxWidth: '390px',
      }}
      onSubmit={({ email }) => {
        return onForgotPassword({ email });
      }}
    >
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Recover Password',
          defaultMessage: 'Recover Password',
        })}
        isValidForm={formMethods.formState.isValid}
        title={intl.formatMessage({
          description: 'Recovering Password',
          defaultMessage: 'Recovering Password',
        })}
        extraButton={
          <Button
            sx={{ textAlign: 'center', display: 'initial' }}
            variant="secondary"
            onClick={onCancel}
          >
            {intl.formatMessage({
              description: 'Cancel',
              defaultMessage: 'Cancel',
            })}
          </Button>
        }
      >
        <FormFieldInput
          name="email"
          label={intl.formatMessage({
            description: 'Registered Email',
            defaultMessage: 'Registered Email',
          })}
        />

        <NotificationsBox />

        <Text
          sx={{ marginTop: 'xl', cursor: 'pointer' }}
          as={Link}
          onClick={onSignUp}
        >
          {intl.formatMessage({
            description: 'Sign up now',
            defaultMessage: 'Sign up now',
          })}
        </Text>
      </AuthCard>
    </Form>
  );
};
