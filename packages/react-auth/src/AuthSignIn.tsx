import { AuthCard } from './AuthCard';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { PASSWORD_MINIMUM_LENGTH } from '@ttoss/cloud-auth';
import { useI18n } from '@ttoss/react-i18n';
import type { OnSignIn, OnSignInInput } from './types';

export type AuthSignInProps = {
  onSignIn: OnSignIn;
  onSignUp: () => void;
  defaultValues?: Partial<OnSignInInput>;
  urlLogo?: string;
};

export const AuthSignIn = ({
  onSignIn,
  onSignUp,
  defaultValues,
}: AuthSignInProps) => {
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

  const formMethods = useForm<OnSignInInput>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const onSubmitForm = (data: OnSignInInput) => {
    return onSignIn(data);
  };

  return (
    <Form {...formMethods} onSubmit={onSubmitForm}>
      <AuthCard
        title={intl.formatMessage({
          description: 'Sign in title.',
          defaultMessage: 'Login',
        })}
        buttonLabel={intl.formatMessage({
          description: 'Button label.',
          defaultMessage: 'Login',
        })}
        links={[
          {
            onClick: onSignUp,
            label: intl.formatMessage({
              description: 'Link to retrieve password.',
              defaultMessage: 'Do you forgot your password?',
            }),
          },
          {
            onClick: onSignUp,
            label: intl.formatMessage({
              description: 'Link to sign up.',
              defaultMessage: "Don't have an account? Sign up",
            }),
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
