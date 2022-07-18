# @ttoss/google-maps

<strong>@ttoss/google-maps</strong> is an opinionated way to use Google Maps in your React application.

## Installing

Install `@ttoss/google-maps` in your project:

```shell
$ yarn add @ttoss/google-maps
# or
$ npm install @ttoss/google-maps
```

If you use TypeScript, add the following to a declaration file (generally `typings.d.ts`):

```typescript title="typings.d.ts"
/// <reference types="google.maps" />
```

## Configuring `GoogleMapsProvider`

At the root of your application, configure `GoogleMapsProvider` with your Google Maps API key. This way, the whole application can access the `google` variable.

```tsx
import { GoogleMapsProvider } from '@ttoss/google-maps';

const App = ({ children }) => {
  return (
    <OtherProviders>
      <GoogleMapsProvider apiKey={process.env.GOOGLE_MAPS_API_KEY}>
        {children}
      </GoogleMapsProvider>
    </OtherProviders>
  );
};
```

## Rendering the Map

At the component level, render Google Maps using `useMap` hook:

```tsx
import { Box, Text } from '@ttoss/ui';
import { useMap } from '@ttoss/google-maps';

const MyComponent = () => {
  const { ref, map } = useMap();

  React.useEffect(() => {
    // You have access to every map methods, like `setOptions`, through `map`.
  }, [map]);

  return (
    <Box>
      <Text>My Map</Text>
      <Box ref={ref} sx={{ height, width }} />
    </Box>
  );
};
```
