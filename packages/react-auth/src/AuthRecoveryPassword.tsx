import { AuthCard } from './AuthCard';
import { Button, Link, Text } from '@ttoss/ui';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { NotificationsBox } from '@ttoss/react-notifications';
import { useI18n } from '@ttoss/react-i18n';

export type AuthRecoveryPasswordProps = {
  onRecoveryPassword: (email: string) => void;
};

export const AuthRecoveryPassword = ({
  onRecoveryPassword,
}: AuthRecoveryPasswordProps) => {
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

  const formMethods = useForm<yup.TypeOf<typeof schema>>({
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
        return onRecoveryPassword(email);
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

        <Text sx={{ marginTop: 'xl', cursor: 'pointer' }} as={Link}>
          {intl.formatMessage({
            description: 'Sign up now',
            defaultMessage: 'Sign up now',
          })}
        </Text>
      </AuthCard>
    </Form>
  );
};
