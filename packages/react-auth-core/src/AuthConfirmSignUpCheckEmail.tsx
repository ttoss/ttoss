import { NotificationCard } from '@ttoss/components/NotificationCard';
import { useI18n } from '@ttoss/react-i18n';

import { AuthCard } from './AuthCard';
import type { OnConfirmSignUpCheckEmail } from './types';

export type AuthConfirmSignUpCheckEmailProps = {
  onConfirmSignUpCheckEmail: OnConfirmSignUpCheckEmail;
};

export const AuthConfirmSignUpCheckEmail = ({
  onConfirmSignUpCheckEmail,
}: AuthConfirmSignUpCheckEmailProps) => {
  const { intl } = useI18n();

  return (
    <form onSubmit={onConfirmSignUpCheckEmail}>
      <AuthCard
        isValidForm={true}
        buttonLabel={intl.formatMessage({
          description: 'Sign In',
          defaultMessage: 'Sign In',
        })}
        title={intl.formatMessage({
          description: 'Confirmation',
          defaultMessage: 'Confirmation',
        })}
      >
        <NotificationCard
          type="info"
          message={intl.formatMessage({
            defaultMessage:
              'An email has been sent to your address. Please check your inbox and follow the instructions to confirm your sign up.',
          })}
        />
      </AuthCard>
    </form>
  );
};
