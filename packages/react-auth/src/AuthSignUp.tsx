import * as React from 'react';
import { AuthCard } from './AuthCard';
import { Flex, Link, Text } from '@ttoss/ui';
import {
  Form,
  FormFieldInput,
  FormFieldPassword,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { NotificationBox, useNotifications } from '@ttoss/react-notifications';
import { PASSWORD_MINIMUM_LENGTH } from '@ttoss/cloud-auth';
import { useI18n } from '@ttoss/react-i18n';
import type { OnSignUp, OnSignUpInput } from './types';

export type AuthSignUpProps = {
  onSignUp: OnSignUp;
  onReturnToSignIn: () => void;
};

export const AuthSignUp = ({ onSignUp, onReturnToSignIn }: AuthSignUpProps) => {
  const { intl } = useI18n();
  const { setNotifications } = useNotifications();

  React.useEffect(() => {
    setNotifications(undefined);
  }, [setNotifications]);

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
    confirmPassword: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Confirm Password is required.',
          defaultMessage: 'Confirm password field is required',
        })
      )
      .oneOf(
        [yup.ref('password')],
        intl.formatMessage({
          description: 'Passwords are not the same',
          defaultMessage: 'Passwords are not the same',
        })
      ),
  });

  const formMethods = useForm<OnSignUpInput>({
    mode: 'all',
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
          defaultMessage: 'Sign up',
        })}
        title={intl.formatMessage({
          description: 'Title on sign up.',
          defaultMessage: 'Sign up',
        })}
        isValidForm={formMethods.formState.isValid}
        extraButton={
          <Text onClick={onReturnToSignIn} as={Link}>
            {intl.formatMessage({
              description: 'Link to sign in on sign up.',
              defaultMessage: 'I’m already registered',
            })}
          </Text>
        }
      >
        <Flex sx={{ flexDirection: 'column', gap: 'xl' }}>
          <FormFieldInput
            name="email"
            label={intl.formatMessage({
              description: 'Email label.',
              defaultMessage: 'Email',
            })}
          />
          <FormFieldPassword
            name="password"
            label={intl.formatMessage({
              description: 'Password label.',
              defaultMessage: 'Password',
            })}
          />
          <FormFieldPassword
            name="confirmPassword"
            label={intl.formatMessage({
              description: 'Confirm Password label.',
              defaultMessage: 'Confirm password',
            })}
          />
        </Flex>

        <NotificationBox />
      </AuthCard>
    </Form>
  );
};
