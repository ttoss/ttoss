import * as React from 'react';

export const MapContext = React.createContext<{
  map: google.maps.Map | null;
  ref: React.ForwardedRef<HTMLDivElement>;
}>({
  map: null,
  ref: { current: null },
});

export const MapProvider = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    map: google.maps.Map | null;
  }
>(({ children, map }, ref) => {
  return (
    <MapContext.Provider value={{ map, ref }}>{children}</MapContext.Provider>
  );
});

MapProvider.displayName = 'MapProvider';
