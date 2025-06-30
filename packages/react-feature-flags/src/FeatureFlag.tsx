import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useFeatureFlag } from './useFeatureFlag';

export interface FeatureFlagProps {
  name: FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const FeatureFlag = ({
  name,
  children,
  fallback = null,
  errorFallback = null,
}: FeatureFlagProps) => {
  const isEnabled = useFeatureFlag(name);

  if (!isEnabled) {
    return fallback;
  }

  return <ErrorBoundary fallback={errorFallback}>{children}</ErrorBoundary>;
};
