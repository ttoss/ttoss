import * as React from 'react';
import { useFeatureFlag } from './useFeatureFlag';

export interface FeatureFlagProps {
  name: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag = ({
  name,
  children,
  fallback = null,
}: FeatureFlagProps) => {
  const isEnabled = useFeatureFlag(name);

  if (!isEnabled) {
    return fallback;
  }

  return <>{children}</>;
};
