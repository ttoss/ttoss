import type { GeovisWorkspaceSelection } from '../context/GeovisWorkspaceContext';

/** Whether two selections hold the same value in every menu. */
export const sameSelection = (
  a: GeovisWorkspaceSelection,
  b: GeovisWorkspaceSelection
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};
