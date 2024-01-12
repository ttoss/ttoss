import * as React from 'react';
import { FeatureFlagsContext } from './FeatureFlagsProvider';

/**
 * If you want to update the feature flags on React environment
 * (after the initial render and providers), you can use this hook.
 */
export const useUpdateFeatures = () => {
  const { setFeatures } = React.useContext(FeatureFlagsContext);
  return {
    updateFeatures: setFeatures,
  };
};
