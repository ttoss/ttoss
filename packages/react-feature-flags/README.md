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
  const { features } = await response.json();
  return features; // features is string[]
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

You can update feature flags by calling `updateFeatures` function that is returned from `useUpdateFeatures` hook. This is useful when you want to update feature flags after providers are initialized.

```tsx
import { useUpdateFeatures } from '@ttoss/react-feature-flags';

const MyComponent = () => {
  const { updateFeatures } = useUpdateFeatures();
  const handleClick = async () => {
    const response = await fetch('https://...');
    const { features } = await response.json();
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

## Examples

### `loadFeatures` function needs a hook

If `loadFeatures` function needs to use data from a hook, you can create a custom Provider that uses the hook, passes the data to `loadFeatures` function, and then wraps the `FeatureFlagsProvider`.

For example, you need `userId` from a custom hook `useMe` to load features:

```tsx
import * as React from 'react';
import { FeatureFlagsProvider as TtossFeatureFlagsProvider } from '@ttoss/react-feature-flags';

const FeatureFlagsProvider = ({ children }: { children: React.ReactNode }) => {
  const { me } = useMe();

  const loadFeatures = React.useCallback(async () => {
    if (!me?.email) {
      return [];
    }

    /**
     * Specify modules that some users have access to.
     */
    if (me.email === 'user@example.com') {
      return ['module1', 'module2'];
    }

    return [];
  }, [me?.email]);

  return (
    <TtossFeatureFlagsProvider loadFeatures={loadFeatures}>
      {children}
    </TtossFeatureFlagsProvider>
  );
};
```
