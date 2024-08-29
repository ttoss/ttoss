import { FeatureFlag, FeatureFlagsProvider } from 'src/index';
import { act, render, screen } from '@ttoss/test-utils';

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

test('should not render component when feature is disabled', async () => {
  render(
    <Provider>
      <FeatureFlag name="feature3">
        <div>Feature 3</div>
      </FeatureFlag>
    </Provider>
  );

  /**
   * This is needed because of loadFeatures is async.
   */
  await act(() => {
    return jest.runAllTimersAsync();
  });

  const element = screen.queryByText('Feature 3');

  expect(element).not.toBeInTheDocument();
});

test('should render component when feature is disabled but fallback is provided', async () => {
  render(
    <Provider>
      <FeatureFlag name="feature3" fallback={<div>Feature 3 disabled</div>}>
        <div>Feature 3</div>
      </FeatureFlag>
    </Provider>
  );

  expect(await screen.findByText('Feature 3 disabled')).toBeInTheDocument();
});
