import { NotificationCard } from '@ttoss/components/NotificationCard';
import { notify } from '@ttoss/logger';
import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary';

const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
  const { intl } = useI18n();

  return (
    <div role="alert">
      <NotificationCard
        type="error"
        message={intl.formatMessage({
          defaultMessage:
            'An error occurred with your authentication. Please try again.',
        })}
        onClose={resetErrorBoundary}
      />
    </div>
  );
};

export const ErrorBoundary = ({ children }: React.PropsWithChildren) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        notify({
          type: 'error',
          title: 'Authentication Error',
          message: error.message,
        });
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
