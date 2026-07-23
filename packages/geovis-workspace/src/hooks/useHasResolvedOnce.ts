import { useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

/**
 * Whether the runtime's `result` has ever been `'resolved'`, from this mount
 * onward. Stays `true` forever once it flips — a later failure is a stale-
 * spec case `GeoVisProvider` already owns (it keeps showing the last good
 * spec), not the cold-start case this hook exists for.
 */
export const useHasResolvedOnce = (): boolean => {
  const { result } = useGeoVis();

  // "Adjusting state when a prop changes", the React-documented alternative
  // to an effect for this exact shape (https://react.dev/learn/you-might-not-need-an-effect):
  // setState called conditionally during render, guarded by a change check,
  // re-renders immediately with the update instead of committing a stale
  // frame first.
  const [prevStatus, setPrevStatus] = React.useState(result.status);
  const [hasResolvedOnce, setHasResolvedOnce] = React.useState(() => {
    return result.status === 'resolved';
  });

  if (result.status !== prevStatus) {
    setPrevStatus(result.status);
    if (result.status === 'resolved') setHasResolvedOnce(true);
  }

  return hasResolvedOnce;
};
