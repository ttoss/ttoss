import { act, render, screen } from '@ttoss/test-utils/react';
import {
  FeatureFlag,
  FeatureFlagsProvider,
  useUpdateFeatures,
} from 'src/index';

const loadFeatures = async () => {
  return ['feature1', 'feature2'];
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <FeatureFlagsProvider loadFeatures={loadFeatures}>
      {children}
    </FeatureFlagsProvider>
  );
};

test('should render component when feature is enabled', async () => {
  render(
    <Provider>
      <FeatureFlag name="feature1">
        <div>Feature 1</div>
      </FeatureFlag>
    </Provider>
  );

  expect(await screen.findByText('Feature 1')).toBeInTheDocument();
});

test('should update features', async () => {
  const UpdateFeatures = () => {
    const { updateFeatures } = useUpdateFeatures();

    return (
      <button
        onClick={() => {
          return updateFeatures(['feature3']);
        }}
      >
        Update features
      </button>
    );
  };

  render(
    <Provider>
      <FeatureFlag name="feature3" fallback={<div>Disabled</div>}>
        <div>Feature 3</div>
      </FeatureFlag>
      <UpdateFeatures />
    </Provider>
  );

  expect(await screen.findByText('Disabled')).toBeInTheDocument();

  await act(() => {
    return screen.getByText('Update features').click();
  });

  expect(await screen.findByText('Feature 3')).toBeInTheDocument();
});
