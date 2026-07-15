import { useGeoVis } from '@ttoss/geovis';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { getResultIssues, getResultSeverity, isColdStart } from '../warnings';
import { IssueList } from './IssueList';

/**
 * Default content of the `warnings` slot: every issue on the current
 * `useGeoVis().result`, resolved or failing, via the shared `IssueList`.
 * Renders nothing during the cold-start case — the `map` slot's own empty
 * state already shows the same issues, so this avoids a duplicate,
 * separately-clickable set of repair buttons on screen.
 */
export const WarningsPanel = () => {
  const { result } = useGeoVis();
  const { onRepair, hasResolvedOnce } = useGeovisWorkspace();

  if (isColdStart({ result, hasResolvedOnce })) return null;

  return (
    <IssueList
      issues={getResultIssues(result)}
      severity={getResultSeverity(result)}
      onRepair={onRepair}
    />
  );
};
