import * as React from 'react';
import { FeatureFlagsContext } from './FeatureFlagsProvider';

export const useFeatureFlag = (name: FeatureFlags) => {
  const { features } = React.useContext(FeatureFlagsContext);
  return features.includes(name);
};
