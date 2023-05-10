import { AuthCard } from './AuthCard';
import { Button, Flex, Link, Text } from '@ttoss/ui';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '@ttoss/forms';
import { PASSWORD_MINIMUM_LENGTH } from '@ttoss/cloud-auth';
import { useHidePassInput } from './useHidePassInput';
import { useI18n } from '@ttoss/react-i18n';
import type { OnSignIn, OnSignInInput } from './types';

export type AuthSignInProps = {
  onSignIn: OnSignIn;
  onSignUp: () => void;
  onForgotPassword?: () => void;
  defaultValues?: Partial<OnSignInInput>;
  urlLogo?: string;
};

export const AuthSignIn = ({
  onSignIn,
  onSignUp,
  defaultValues,
  onForgotPassword,
}: AuthSignInProps) => {
  const { intl } = useI18n();

  const { handleClick, icon, inputType } = useHidePassInput();

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
    // remember: yup.boolean(),
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
          defaultMessage: 'Log in',
        })}
        buttonLabel={intl.formatMessage({
          description: 'Button label.',
          defaultMessage: 'Log in',
        })}
        isValidForm={formMethods.formState.isValid}
        extraButton={
          <Button
            type="button"
            variant="secondary"
            sx={{ textAlign: 'center', display: 'initial' }}
            onClick={onSignUp}
            aria-label="sign-up"
          >
            {intl.formatMessage({
              description: 'Sign up',
              defaultMessage: 'Sign up',
            })}
          </Button>
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
          <FormFieldInput
            name="password"
            trailingIcon={icon}
            onTrailingIconClick={handleClick}
            type={inputType}
            label={intl.formatMessage({
              description: 'Password label.',
              defaultMessage: 'Password',
            })}
          />
        </Flex>

        <Flex sx={{ justifyContent: 'space-between', marginTop: 'lg' }}>
          {/* TODO: temporally commented */}
          {/* <FormFieldCheckbox
            name="remember"
            label={intl.formatMessage({
              description: 'Remember',
              defaultMessage: 'Remember',
            })}
          /> */}

          <Text as={Link} onClick={onForgotPassword}>
            {intl.formatMessage({
              description: 'Forgot password?',
              defaultMessage: 'Forgot password?',
            })}
          </Text>
        </Flex>
      </AuthCard>
    </Form>
  );
};
