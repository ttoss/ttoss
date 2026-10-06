import { NotificationCard } from '@ttoss/components';
import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';
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

export type ErrorBoundaryProps = React.PropsWithChildren<{
  /** Receives an error thrown while rendering the auth flow. */
  onError?: (error: unknown) => void;
}>;

export const ErrorBoundary = ({ children, onError }: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={onError}>
      {children}
    </ReactErrorBoundary>
  );
};
