import * as React from 'react';

export const FeatureFlagsContext = React.createContext<{
  features: FeatureFlags[];
  setFeatures: (features: FeatureFlags[]) => void;
}>({
  features: [],
  setFeatures: () => {},
});

export const FeatureFlagsProvider = ({
  children,
  loadFeatures,
}: {
  children: React.ReactNode;
  loadFeatures?: () => Promise<FeatureFlags[]>;
}) => {
  const [features, setFeatures] = React.useState<FeatureFlags[]>([]);

  React.useEffect(() => {
    loadFeatures?.().then((features) => {
      return setFeatures(features);
    });
  }, [loadFeatures]);

  return (
    <FeatureFlagsContext.Provider value={{ features, setFeatures }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
