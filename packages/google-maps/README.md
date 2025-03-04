# @ttoss/google-maps

<strong>@ttoss/google-maps</strong> is an opinionated way to use Google Maps in your React application.

## Installing

Install `@ttoss/google-maps` in your project:

```shell
$ pnpm add @ttoss/google-maps
```

If you use TypeScript, install the types for Google Maps:

```shell
$ pnpm add -D @types/google.maps
```

Then, add the following to a declaration file (generally `typings.d.ts`):

```typescript title="typings.d.ts"
/// <reference types="google.maps" />
```

## Getting Started

### Configuring `GoogleMapsProvider`

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

### Rendering the Map

At the component level, render Google Maps using `useMap` hook:

```tsx
import { Box, Text } from '@ttoss/ui';
import { useMap } from '@ttoss/google-maps';

const MyComponent = () => {
  const { ref, map } = useMap();

  React.useEffect(() => {
    if (map) {
      map.setOptions({
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
      });
    }
  }, [map]);

  return (
    <Box>
      <Text>My Map</Text>
      <Box ref={ref} sx={{ height, width }} />
    </Box>
  );
};
```

If everything is set up correctly, you should see a map centered at the specified coordinates.

### Retrieve `google.maps` object

If you need to access the `google.maps` object, you can use the `useGoogleMaps` hook:

```tsx
import { useGoogleMaps } from '@ttoss/google-maps';

const MyComponent = () => {
  const { google } = useGoogleMaps();

  return <Text>{google.maps.version}</Text>;
};
```

With this, you can perform any operation that the `google.maps` object allows, such as creating markers, drawing polygons, etc.

## Advanced Usage

### Using with Next.js (custom Script component)

If you use Next.js, you can use the `GoogleMapsProvider` passing [Next.js `Script`](https://nextjs.org/docs/app/api-reference/components/script) component as a prop:

```tsx
import { GoogleMapsProvider } from '@ttoss/google-maps';
import Script from 'next/script';

const App = ({ children }) => {
  return (
    <OtherProviders>
      <GoogleMapsProvider
        apiKey={process.env.GOOGLE_MAPS_API_KEY}
        Script={Script}
      >
        {children}
      </GoogleMapsProvider>
    </OtherProviders>
  );
};
```

### Reusing `map` object

If you need to access the `map` object in multiple components, you can use `MapProvider` to share it:

```tsx
import { MapProvider, useMap } from '@ttoss/google-maps';

const ChildComponent = () => {
  // Access the map object created by the parent component
  const { map } = useMap();

  React.useEffect(() => {
    if (map) {
      map.setOptions({
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
      });
    }
  }, [map]);

  return null;
};

const ParentComponent = () => {
  const { ref, map } = useMap();

  return (
    <MapProvider map={map} ref={ref}>
      <Box>
        <Text>My Map</Text>
        <Box ref={ref} sx={{ height, width }} />
        <ChildComponent />
      </Box>
    </MapProvider>
  );
};
```

## API

### `GoogleMapsProvider`

#### Props

- `apiKey`: string - Google Maps API key.
- `libraries`: string[] - [Libraries to load](https://developers.google.com/maps/documentation/javascript/libraries).
- `language`: string - [Language](https://developers.google.com/maps/documentation/javascript/localization).
- `Script`: React.ComponentType - Custom `Script` component to use.
- `onError`: (error: Error) => void - Callback to handle script loading errors.

### `MapProvider`

#### Props

- `map`: google.maps.Map | null - Google Maps object.
- `children`: React.ReactNode - Children to render.
- `ref`: `React.RefObject<HTMLDivElement>` - Reference to the map container.

### `useMap`

`useMap` is a hook that returns a reference to the map container and the Google Maps object. It creates a new map object if it doesn't exist or returns the existing map if `MapProvider` wraps the component tree.

#### Returns

- `ref`: `React.RefObject<HTMLDivElement>` - Reference to the map container.
- `map`: google.maps.Map | null - Google Maps object.

### `useGoogleMaps`

#### Returns

- `google`: typeof google - `google.maps` object.
- `status`: 'idle' | 'error' | 'loading' | 'ready' - Status of the script loading.
- `isReady`: boolean - Whether the script is ready. The same as `status === 'ready'`.

```

```
