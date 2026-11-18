import * as React from 'react';

import { useGeovisWorkspace } from './useGeovisWorkspace';

/**
 * Whether the whole selection was replaced since the last render — as
 * switching the side of a split map does. A control holding its value locally
 * reads it again from the selection then, rather than writing the value it
 * held for the selection before over the new one.
 *
 * @returns `true` on the render that follows a replacement.
 *
 * @example
 * if (useSelectionReplaced()) setValue(selection[menuId] ?? defaultValue);
 */
export const useSelectionReplaced = (): boolean => {
  const { selectionEpoch } = useGeovisWorkspace();
  const [epoch, setEpoch] = React.useState(selectionEpoch);
  if (epoch === selectionEpoch) return false;
  setEpoch(selectionEpoch);
  return true;
};
