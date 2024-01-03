# @ttoss/react-feature-flags

React Feature Flags is a library that allows you to easily add feature flags to your React application using ttoss ecosystem.

## Installation

```bash
pnpm add @ttoss/react-feature-flags
```

## Getting started

Initialize the library by wrapping your application with `FeatureFlagsProvider` and passing `loadFeatures` function as a prop (`loadFeatures` is not required). `loadFeatures` function should return a promise that resolves to an object with feature flags.

```tsx
import {
  FeatureFlagsProvider,
  useFeatureFlag,
} from '@ttoss/react-feature-flags';

/**
 * Load features from your backend or any other source.
 */
const loadFeatures = async () => {
  const response = await fetch('https://...');
  const features = await response.json();
  return features; // string[]
};

const App = () => {
  return (
    <FeatureFlagsProvider loadFeatures={loadFeatures}>
      <MyComponent />
    </FeatureFlagsProvider>
  );
};
```

Use `useFeatureFlag` hook to get a feature flag value.

```tsx
import { useFeatureFlag } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  const isFeatureEnabled = useFeatureFlag('my-feature');
  return <div>{isFeatureEnabled ? 'Enabled' : 'Disabled'}</div>;
};
```

## Usage

### `useFeatureFlag` hook

You can use `useFeatureFlag` hook to get a feature flag value. It returns `true` if the feature flag is enabled, `false` otherwise.

```tsx
import { useFeatureFlag } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  const isFeatureEnabled = useFeatureFlag('my-feature');
  return <div>{isFeatureEnabled ? 'Enabled' : 'Disabled'}</div>;
};
```

### `FeatureFlag` component

You can use `FeatureFlag` component to render its children only if the feature flag is enabled. It has a `fallback` (optional) prop that can be used to render something else if the feature flag is disabled.

```tsx
import { FeatureFlag } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  return (
    <FeatureFlag name="my-feature" fallback={<div>Feature is disabled</div>}>
      <div>Feature is enabled</div>
    </FeatureFlag>
  );
};
```

### Update feature flags

You can update feature flags by calling `updateFeatures` function that is returned from `useFeatureFlags` hook. This is useful when you want to update feature flags after providers are initialized.

```tsx
import { useFeatureFlags } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  const { updateFeatures } = useFeatureFlags();
  const handleClick = async () => {
    const response = await fetch('https://...');
    const features = await response.json();
    updateFeatures(features);
  };
  return <button onClick={handleClick}>Update features</button>;
};
```

### TypeScript

If you are using TypeScript, you can define your feature flags names on `feature-flags.d.ts` file.

```ts
import '@ttoss/react-feature-flags';

declare module '@ttoss/react-feature-flags' {
  export type FeatureFlags = 'my-feature' | 'my-other-feature';
}
```

This will allow you to use `useFeatureFlag` hook with type safety.

```tsx
import { useFeatureFlag } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  const isFeatureEnabled = useFeatureFlag('my-feature');
  return <div>{isFeatureEnabled ? 'Enabled' : 'Disabled'}</div>;
};
```
