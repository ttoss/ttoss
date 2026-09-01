import * as React from 'react';

import type { GeovisWorkspaceSidebarTimelineFilter } from './GeovisWorkspaceContext';

/** The lifted timeline: its config and the live playback state driving it. */
export interface TimelineContextValue {
  /** The `timeline` control from the sidebar's `filters` section, if any. */
  filter?: GeovisWorkspaceSidebarTimelineFilter;
  /** Current point on the timeline. */
  value: number;
  /** Moves to a point, stopping playback is the caller's business. */
  setValue: (next: number) => void;
  /** Whether the auto-advance is running. */
  playing: boolean;
  /** Starts or stops the auto-advance. */
  togglePlay: () => void;
  /** Seconds between auto-advance steps. */
  intervalSeconds: number;
  /** Sets the auto-advance cadence. */
  setIntervalSeconds: (next: number) => void;
}

/**
 * Inert default, used only outside a provider. `filter: undefined` is the same
 * shape a config with no timeline produces, and both consumers already render
 * nothing for it — so a missing provider degrades to "no timeline" instead of
 * throwing or needing null checks at every read.
 */
const INERT: TimelineContextValue = {
  value: 0,
  setValue: () => {},
  playing: false,
  togglePlay: () => {},
  intervalSeconds: 1,
  setIntervalSeconds: () => {},
};

/**
 * Holds the timeline state above both surfaces that drive it: the sidebar's
 * `TimelineControl` and the compact `TimelineHud` anchored to the map.
 *
 * It has to live above them because they are siblings, not ancestor and
 * descendant — the HUD is a map overlay while the control is inside the sidebar
 * card, which is hidden (and `aria-hidden`) whenever the sidebar is closed. That
 * is exactly when the HUD matters, so the state can belong to neither.
 */
export const TimelineContext = React.createContext<TimelineContextValue>(INERT);

/**
 * Reads the lifted timeline state.
 *
 * @returns The timeline context; the inert default outside a provider.
 *
 * @example
 * ```tsx
 * const { playing, togglePlay } = useTimelineContext();
 * ```
 */
export const useTimelineContext = (): TimelineContextValue => {
  return React.useContext(TimelineContext);
};
