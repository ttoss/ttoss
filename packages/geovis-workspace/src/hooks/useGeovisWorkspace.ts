import * as React from 'react';

import { GeovisWorkspaceContext } from '../context/GeovisWorkspaceContext';

/**
 * Consumes the GeovisWorkspace context.
 * Must be used inside a GeovisWorkspaceProvider.
 */
export const useGeovisWorkspace = () => {
  const context = React.useContext(GeovisWorkspaceContext);

  if (!context) {
    throw new Error(
      'useGeovisWorkspace must be used within a GeovisWorkspaceProvider'
    );
  }

  return context;
};
