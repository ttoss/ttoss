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
import { Button } from '@ttoss/ui';

import { AuthCard } from './AuthCard';
import type { OnForgotPasswordResetPassword } from './types';

export type AuthForgotPasswordResetPasswordProps = {
  email?: string;
  maxCodeLength?: number;
  onForgotPasswordResetPassword: OnForgotPasswordResetPassword;
  onGoToSignIn: () => void;
  passwordMinimumLength?: number;
};

export const AuthForgotPasswordResetPassword = (
  props: AuthForgotPasswordResetPasswordProps
) => {
  const { intl } = useI18n();

  const codeValidation = yup.string().required(
    intl.formatMessage({
      description: 'Required field.',
      defaultMessage: 'Required field',
    })
  );

  const schema = yup.object().shape({
    code: props.maxCodeLength
      ? codeValidation
          .min(
            props.maxCodeLength,
            intl.formatMessage(
              {
                description: 'Minimum {value} characters.',
                defaultMessage: 'Minimum {value} characters',
              },
              { value: props.maxCodeLength }
            )
          )
          .max(
            props.maxCodeLength,
            intl.formatMessage(
              {
                description: 'Maximum {value} characters.',
                defaultMessage: 'Maximum {value} characters',
              },
              { value: props.maxCodeLength }
            )
          )
      : codeValidation,
    newPassword: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Password is required.',
          defaultMessage: 'Password field is required',
        })
      )
      .min(
        props.passwordMinimumLength || 8,
        intl.formatMessage(
          {
            description: 'Password must be at least {value} characters long.',
            defaultMessage: 'Password requires {value} characters',
          },
          { value: props.passwordMinimumLength || 8 }
        )
      )
      .trim(),
  });

  const formMethods = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  return (
    <Form
      {...formMethods}
      sx={{
        maxWidth: '390px',
      }}
      onSubmit={({
        code,
        newPassword,
      }: {
        code: string;
        newPassword: string;
      }) => {
        return props.onForgotPasswordResetPassword({
          email: props.email,
          code,
          newPassword,
        });
      }}
    >
      <AuthCard
        buttonLabel={intl.formatMessage({
          description: 'Reset Password',
          defaultMessage: 'Reset Password',
        })}
        isValidForm={formMethods.formState.isValid}
        title={intl.formatMessage({
          description: 'Reset Password',
          defaultMessage: 'Reset Password',
        })}
        extraButton={
          props.onGoToSignIn ? (
            <Button
              type="button"
              sx={{ textAlign: 'center', display: 'initial' }}
              variant="secondary"
              onClick={props.onGoToSignIn}
            >
              {intl.formatMessage({
                description: 'Cancel',
                defaultMessage: 'Cancel',
              })}
            </Button>
          ) : null
        }
      >
        <FormFieldInput
          name="code"
          label={intl.formatMessage({
            description: 'Confirmation code',
            defaultMessage: 'Confirmation code',
          })}
        />

        <FormFieldPassword
          name="newPassword"
          label={intl.formatMessage({
            description: 'New Password',
            defaultMessage: 'New Password',
          })}
        />

        <NotificationsBox />
      </AuthCard>
    </Form>
  );
};
