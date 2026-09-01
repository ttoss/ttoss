import * as React from 'react';

import type { GeovisWorkspaceSidebarTimelineFilter } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';

/** Default seconds between auto-advance steps while playing. */
const DEFAULT_PLAY_INTERVAL_SECONDS = 1;

const seedValue = ({
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
 * The lifted timeline state: the current `value` (a point on the timeline — a
 * year, month, day, or any numeric step), its setter, and play/pause. Publishes
 * the value to the shared selection when the timeline carries a `menuId`, and
 * auto-advances while playing until it reaches the ceiling.
 *
 * `enabled` mirrors the gate on the section that holds the timeline (see
 * `GeovisWorkspaceSidebarSection.enabledWhen`). While it is `false` the value
 * freezes: playback is suspended, so auto-advance cannot go on publishing a
 * value the user can neither see nor control, and the last value stays in the
 * selection. Returning to an enabling variation resumes both the value and, if
 * play was never toggled off, the playback itself.
 */
export const useTimeline = ({
  timeline,
  enabled,
}: {
  timeline?: GeovisWorkspaceSidebarTimelineFilter;
  enabled: boolean;
}) => {
  const { selection, setSelection, setLeftSidebarOpen, notifyPlaybackStart } =
    useGeovisWorkspace();

  const timelineMenuId = timeline?.menuId;
  const timelineMax = timeline?.max ?? 0;
  const timelineMin = timeline?.min ?? 0;
  const timelineStep = timeline?.step ?? 1;

  const [value, setValue] = React.useState<number>(() => {
    // Seed from the shared selection when the timeline drives it, so a
    // controlled/seeded value is reflected on first render.
    const seeded = timelineMenuId ? Number(selection[timelineMenuId]) : NaN;
    return seedValue({ timeline, seeded });
  });

  // Publish the value to the shared selection (as a string) so the app can
  // react to it — this is what wires the time-lapse to the map. No-op when the
  // timeline has no `menuId` (visual-only). Writes only when the value actually
  // changes: without this guard the effect would re-run on every render (an
  // unstable `setSelection`/`selection` identity) and loop indefinitely.
  React.useEffect(() => {
    if (timelineMenuId && selection[timelineMenuId] !== String(value)) {
      setSelection({ menuId: timelineMenuId, value: String(value) });
    }
  }, [timelineMenuId, value, selection, setSelection]);

  const [playRequested, setPlayRequested] = React.useState(false);

  // A closed gate suspends playback: without this, a time-lapse started while
  // the timeline was reachable would keep ticking after the user switched to a
  // variation it does not apply to, writing a value nothing on screen explains.
  // Derived rather than pushed into state through an effect — an effect calling
  // `setPlaying` here would cascade a second render on every gate change.
  const playing = playRequested && enabled;

  // Seconds between auto-advance steps, editable via the timeline's interval
  // input; clamped to [0.1, 10] by that control.
  const [intervalSeconds, setIntervalSeconds] = React.useState(
    DEFAULT_PLAY_INTERVAL_SECONDS
  );

  // Auto-advance the value while playing; stop once it reaches the ceiling.
  React.useEffect(() => {
    if (!playing) {
      return;
    }

    const id = setInterval(() => {
      setValue((current) => {
        if (current >= timelineMax) {
          setPlayRequested(false);
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
    setPlayRequested((current) => {
      // Restart from the beginning when replaying from the ceiling.
      if (!current && value >= timelineMax) {
        setValue(timelineMin);
      }
      return !current;
    });
    // `closeOnPlay` fires only on the transition into playback: the point is to
    // clear the sidebar off the map that is about to animate, and pausing has
    // no such reason (by then the sidebar is usually already closed). Reaching
    // the ceiling stops playback through the auto-advance effect, not here, so
    // it never touches the sidebar either. Read from the render's `playing`
    // rather than the updater above, which must stay free of side effects.
    if (!playing) {
      // Reported upward rather than kept here: `GeovisWorkspace` needs it to
      // lift the map's layer control clear of the compact HUD, and that offset
      // is applied above this hook's provider.
      notifyPlaybackStart();
      if (timeline?.closeOnPlay) {
        setLeftSidebarOpen({ open: false });
      }
    }
  };

  return {
    value,
    setValue,
    playing,
    togglePlay,
    intervalSeconds,
    setIntervalSeconds,
  };
};
