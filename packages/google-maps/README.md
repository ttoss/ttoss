# @ttoss/google-maps

<strong>@ttoss/google-maps</strong> provides a concise, opinionated way to use Google Maps in React apps. This guide covers setup, usage, and key API features so you can get started quickly.

## Installing

Install the package:

```shell
pnpm add @ttoss/google-maps
```

For TypeScript support:

```shell
pnpm add -D @types/google.maps
```

Add this to a declaration file (e.g., `typings.d.ts`):

```typescript title="typings.d.ts"
/// <reference types="google.maps" />
```

## Getting Started

Set up `GoogleMapsProvider` at your app root to provide the Google Maps context. This enables all child components to access the Google Maps API.

```tsx
import { GoogleMapsProvider } from '@ttoss/google-maps';

const App = ({ children }) => (
  <GoogleMapsProvider apiKey={process.env.GOOGLE_MAPS_API_KEY}>
    {children}
  </GoogleMapsProvider>
);
```

## Rendering the Map

Use the `useMap` hook to render a map in your component. Define `height` and `width` for the map container:

```tsx
import { Box, Text } from '@ttoss/ui';
import { useMap } from '@ttoss/google-maps';
import * as React from 'react';

const height = 400;
const width = '100%';

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

## Accessing the `google.maps` Object

Use the `useGoogleMaps` hook to access the `google.maps` object for advanced API usage:

```tsx
import { useGoogleMaps } from '@ttoss/google-maps';

const MyComponent = () => {
  const { google } = useGoogleMaps();
  return <Text>{google.maps.version}</Text>;
};
```

## Advanced Usage

### Using with Next.js

If you use Next.js, pass the [Next.js `Script`](https://nextjs.org/docs/app/api-reference/components/script) component to `GoogleMapsProvider`:

```tsx
import { GoogleMapsProvider } from '@ttoss/google-maps';
import Script from 'next/script';

const App = ({ children }) => (
  <GoogleMapsProvider apiKey={process.env.GOOGLE_MAPS_API_KEY} Script={Script}>
    {children}
  </GoogleMapsProvider>
);
```

### Reusing the `map` Object

Use `MapProvider` to share the map object between components:

```tsx
import { MapProvider, useMap } from '@ttoss/google-maps';

const ChildComponent = () => {
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
  const height = 400;
  const width = '100%';
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

### Adding a Marker

To use markers, include the `marker` library in `GoogleMapsProvider`:

```tsx
<GoogleMapsProvider
  apiKey={process.env.GOOGLE_MAPS_API_KEY}
  libraries={['marker']}
>
  {children}
</GoogleMapsProvider>
```

Add a marker using `google.maps.marker.AdvancedMarkerElement`:

```tsx
import { useMap, useGoogleMaps } from '@ttoss/google-maps';
import React from 'react';

const height = 400;
const width = '100%';

const MyMapWithMarker = ({ location }) => {
  const { ref, map } = useMap();
  const { google } = useGoogleMaps();
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    if (map) {
      map.setOptions({
        center: {
          lat: location.latitude,
          lng: location.longitude,
        },
        zoom: location.zoom || 13,
      });
    }
    if (google?.maps && map && location) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: {
          lat: location.latitude,
          lng: location.longitude,
        },
        map,
        title: location.name,
      });
      markerRef.current = marker;
    }
  }, [map, location, google]);

  return <div ref={ref} style={{ height, width }} />;
};
```

## Error Handling

You can handle script loading errors using the `onError` prop in `GoogleMapsProvider`:

```tsx
<GoogleMapsProvider
  apiKey={process.env.GOOGLE_MAPS_API_KEY}
  onError={(error) => {
    // Handle error
    console.error(error);
  }}
>
  {children}
</GoogleMapsProvider>
```

## API

### `GoogleMapsProvider`

- `apiKey`: string - Google Maps API key.
- `libraries`: string[] - [Libraries to load](https://developers.google.com/maps/documentation/javascript/libraries).
- `language`: string - [Language](https://developers.google.com/maps/documentation/javascript/localization).
- `Script`: React.ComponentType - Custom `Script` component to use.
- `onError`: (error: Error) => void - Callback to handle script loading errors.

### `MapProvider`

- `map`: google.maps.Map | null - Google Maps object.
- `children`: React.ReactNode - Children to render.
- `ref`: `React.RefObject<HTMLDivElement>` - Reference to the map container.

### `useMap`

Returns:

- `ref`: `React.RefObject<HTMLDivElement>` - Reference to the map container.
- `map`: google.maps.Map | null - Google Maps object.

### `useGoogleMaps`

Returns:

- `google`: typeof google - `google.maps` object.
- `status`: 'idle' | 'error' | 'loading' | 'ready' - Status of the script loading.
- `isReady`: boolean - Whether the script is ready (`status === 'ready'`).

_For more on product development principles that guide our approach, see [Product Development Principles](https://ttoss.dev/docs/product/product-development/principles)._
