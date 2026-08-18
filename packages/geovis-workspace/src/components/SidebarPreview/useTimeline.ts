import * as React from 'react';

import type { GeovisWorkspaceSidebarTimelineFilter } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';

/** Default seconds between auto-advance steps while playing. */
const DEFAULT_PLAY_INTERVAL_SECONDS = 1;

const seedYear = ({
  timeline,
  seeded,
}: {
  timeline?: GeovisWorkspaceSidebarTimelineFilter;
  seeded: number;
}) => {
  if (Number.isFinite(seeded)) {
    return seeded;
  }
  return timeline?.defaultValue ?? timeline?.min ?? 0;
};

/**
 * The lifted timeline state: the current `year`, its setter, and play/pause.
 * Publishes the year to the shared selection when the timeline carries a
 * `menuId`, and auto-advances while playing until it reaches the ceiling.
 */
export const useTimeline = (
  timeline?: GeovisWorkspaceSidebarTimelineFilter
) => {
  const { selection, setSelection } = useGeovisWorkspace();

  const timelineMenuId = timeline?.menuId;
  const timelineMax = timeline?.max ?? 0;
  const timelineMin = timeline?.min ?? 0;
  const timelineStep = timeline?.step ?? 1;

  const [year, setYear] = React.useState<number>(() => {
    // Seed from the shared selection when the timeline drives it, so a
    // controlled/seeded year is reflected on first render.
    const seeded = timelineMenuId ? Number(selection[timelineMenuId]) : NaN;
    return seedYear({ timeline, seeded });
  });

  // Publish the year to the shared selection (as a string) so the app can react
  // to it — this is what wires the time-lapse to the map. No-op when the
  // timeline has no `menuId` (visual-only). Writes only when the value actually
  // changes: without this guard the effect would re-run on every render (an
  // unstable `setSelection`/`selection` identity) and loop indefinitely.
  React.useEffect(() => {
    if (timelineMenuId && selection[timelineMenuId] !== String(year)) {
      setSelection({ menuId: timelineMenuId, value: String(year) });
    }
  }, [timelineMenuId, year, selection, setSelection]);

  const [playing, setPlaying] = React.useState(false);

  // Seconds between auto-advance steps, editable via the timeline's interval
  // input; clamped to [0.1, 10] by that control.
  const [intervalSeconds, setIntervalSeconds] = React.useState(
    DEFAULT_PLAY_INTERVAL_SECONDS
  );

  // Auto-advance the year while playing; stop once it reaches the ceiling.
  React.useEffect(() => {
    if (!playing) {
      return;
    }

    const id = setInterval(() => {
      setYear((current) => {
        if (current >= timelineMax) {
          setPlaying(false);
          return timelineMax;
        }
        return Math.min(timelineMax, current + timelineStep);
      });
    }, intervalSeconds * 1000);

    return () => {
      clearInterval(id);
    };
  }, [playing, timelineMax, timelineStep, intervalSeconds]);

  const togglePlay = () => {
    setPlaying((current) => {
      // Restart from the beginning when replaying from the ceiling.
      if (!current && year >= timelineMax) {
        setYear(timelineMin);
      }
      return !current;
    });
  };

  return {
    year,
    setYear,
    playing,
    togglePlay,
    intervalSeconds,
    setIntervalSeconds,
  };
};
