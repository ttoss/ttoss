import * as React from 'react';
import { AuthCard } from './AuthCard';
import { Button } from '@ttoss/ui';
import {
  Form,
  FormFieldInput,
  FormFieldPassword,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { NotificationsBox } from '@ttoss/react-notifications';
import { PASSWORD_MINIMUM_LENGTH } from './config';
import { useI18n } from '@ttoss/react-i18n';
import type { OnForgotPasswordResetPassword } from './types';

export type AuthForgotPasswordResetPasswordProps = {
  email: string;
  onForgotPasswordResetPassword: OnForgotPasswordResetPassword;
  onCancel: () => void;
};

export const AuthForgotPasswordResetPassword = ({
  email,
  onForgotPasswordResetPassword,
  onCancel,
}: AuthForgotPasswordResetPasswordProps) => {
  const { intl } = useI18n();

  const schema = React.useMemo(() => {
    return yup
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
                description:
                  'Password must be at least {value} characters long.',
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
      })
      .required();
  }, [intl]);

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
      onSubmit={({ code, password }) => {
        return onForgotPasswordResetPassword({
          email,
          code,
          newPassword: password,
        });
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
          name="code"
          label={intl.formatMessage({
            description: 'Code',
            defaultMessage: 'Code',
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
        <NotificationsBox />
      </AuthCard>
    </Form>
  );
};
