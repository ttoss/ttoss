import { AuthCard } from './AuthCard';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { PASSWORD_MINIMUM_LENGTH } from '@ttoss/cloud-auth';
import { useI18n } from '@ttoss/react-i18n';
import type { OnSignUp, OnSignUpInput } from './types';

export type AuthSignUpProps = {
  onSignUp: OnSignUp;
  onReturnToSignIn: () => void;
};

export const AuthSignUp = ({ onSignUp, onReturnToSignIn }: AuthSignUpProps) => {
  const { intl } = useI18n();

  const schema = yup.object().shape({
    email: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Email is a required field.',
          defaultMessage: 'Email field is required',
        })
      )
      .email(
        intl.formatMessage({
          description: 'Invalid email.',
          defaultMessage: 'Invalid email',
        })
      ),
    password: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Password is required.',
          defaultMessage: 'Password field is required',
        })
      )
      .min(
        PASSWORD_MINIMUM_LENGTH,
        intl.formatMessage(
          {
            description: 'Password must be at least {value} characters long.',
            defaultMessage: 'Password requires {value} characters',
          },
          { value: PASSWORD_MINIMUM_LENGTH }
        )
      )
      .trim(),
  });

  const formMethods = useForm<OnSignUpInput>({
    resolver: yupResolver(schema),
  });

  const onSubmitForm = (data: OnSignUpInput) => {
    return onSignUp(data);
  };

  return (
    <Form {...formMethods} onSubmit={onSubmitForm}>
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Create account.',
          defaultMessage: 'Create account',
        })}
        title={intl.formatMessage({
          description: 'Title on sign up.',
          defaultMessage: 'Register',
        })}
        links={[
          {
            label: intl.formatMessage({
              description: 'Link to sign in on sign up.',
              defaultMessage: 'Do you already have an account? Sign in',
            }),
            onClick: onReturnToSignIn,
          },
        ]}
      >
        <FormFieldInput
          name="email"
          label={intl.formatMessage({
            description: 'Email label.',
            defaultMessage: 'Email',
          })}
        />
        <FormFieldInput
          name="password"
          label={intl.formatMessage({
            description: 'Password label.',
            defaultMessage: 'Password',
          })}
        />
      </AuthCard>
    </Form>
  );
};
