import {
  Form,
  FormFieldInput,
  FormFieldPassword,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { useI18n } from '@ttoss/react-i18n';
import { NotificationsBox } from '@ttoss/react-notifications';
import { Button, Flex, Link, Text } from '@ttoss/ui';

import { AuthCard } from './AuthCard';
import type { OnSignIn, OnSignInInput } from './types';

export type AuthSignInProps = {
  onSignIn: OnSignIn;
  onGoToSignUp?: () => void;
  onGoToForgotPassword?: () => void;
  defaultValues?: Partial<OnSignInInput>;
  passwordMinimumLength?: number;
};

export const AuthSignIn = ({
  onSignIn,
  onGoToSignUp,
  defaultValues,
  onGoToForgotPassword,
  passwordMinimumLength = 8,
}: AuthSignInProps) => {
  const { intl } = useI18n();

  const schema = yup.object().shape({
    email: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Email is a required field.',
          defaultMessage: 'Enter your email address',
        })
      )
      .email(
        intl.formatMessage({
          description: 'Invalid email.',
          defaultMessage: 'Please, insert a valid e-mail',
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
        passwordMinimumLength,
        intl.formatMessage(
          {
            description: 'Password must be at least {value} characters long.',
            defaultMessage: 'Password requires {value} characters',
          },
          { value: passwordMinimumLength }
        )
      )
      .trim(),
  });

  const formMethods = useForm<OnSignInInput>({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const onSubmitForm = (data: OnSignInInput) => {
    return onSignIn(data);
  };

  return (
    <Form
      sx={{ maxWidth: '390px', width: '100%' }}
      {...formMethods}
      onSubmit={onSubmitForm}
    >
      <AuthCard
        title={intl.formatMessage({
          defaultMessage: 'Sign in',
        })}
        buttonLabel={intl.formatMessage({
          defaultMessage: 'Sign in',
        })}
        isValidForm={formMethods.formState.isValid}
        extraButton={
          onGoToSignUp ? (
            <Button
              type="button"
              variant="secondary"
              sx={{ textAlign: 'center', display: 'initial' }}
              onClick={onGoToSignUp}
            >
              {intl.formatMessage({
                description: 'Sign up',
                defaultMessage: 'Sign up',
              })}
            </Button>
          ) : null
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
        </Flex>

        {onGoToForgotPassword && (
          <Flex sx={{ justifyContent: 'space-between', marginTop: 'lg' }}>
            <Text
              sx={{ marginLeft: 'auto', cursor: 'pointer' }}
              as={Link}
              onClick={onGoToForgotPassword}
            >
              {intl.formatMessage({
                description: 'Forgot password?',
                defaultMessage: 'Forgot password?',
              })}
            </Text>
          </Flex>
        )}

        <NotificationsBox />
      </AuthCard>
    </Form>
  );
};
