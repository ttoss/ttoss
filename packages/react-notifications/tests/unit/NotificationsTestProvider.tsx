import { I18nProvider } from '@ttoss/react-i18n';
import type * as React from 'react';
import { NotificationsProvider } from 'src/Provider';

/**
 * `NotificationsProvider` inside an `I18nProvider`, for tests that pass their
 * own `wrapper` (which replaces the one set in setupTests).
 */
export const NotificationsTestProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <I18nProvider locale="en">
      <NotificationsProvider>{children}</NotificationsProvider>
    </I18nProvider>
  );
};
