import { type MapClickInfo, useGeoVisClick } from '@ttoss/geovis';
import * as React from 'react';

import { type GeovisWorkspaceDetailState } from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from './useGeovisWorkspace';

/** A resolved/rejected `onFeatureSelect` outcome, tagged with the click it belongs to. */
interface FetchResult {
  /** Identity of the click that produced this outcome. */
  key: string;
  error: unknown;
  data: unknown;
}

/** Stable identity of a click, used to match a fetch outcome to the current click. */
const clickIdentity = (info: MapClickInfo): string => {
  return `${info.layerId}:${String(info.featureId)}`;
};

/** The click the detail API should act on, or `null` when `shouldOpen` rejects it. */
const resolveActiveClick = (
  click: MapClickInfo | null,
  shouldOpen?: (info: MapClickInfo) => boolean
): MapClickInfo | null => {
  if (!click) return null;
  if (shouldOpen && !shouldOpen(click)) return null;
  return click;
};

/**
 * Derives the `loading`/`error`/`data` snapshot for the active click. A stored
 * outcome counts only when its `key` matches the active click, so a late
 * outcome from a superseded click reads as still-loading rather than stale.
 */
const toDetailState = (
  result: FetchResult | null,
  key: string
): GeovisWorkspaceDetailState => {
  const resolved = result && result.key === key ? result : null;

  return {
    loading: resolved === null,
    error: resolved ? resolved.error : null,
    data: resolved ? resolved.data : null,
  };
};

/**
 * Drives the imperative right-sidebar detail API. When a map click is accepted
 * by `rightSidebar.shouldOpen` (which defaults to accepting every click), it
 * opens the right sidebar and runs `rightSidebar.onFeatureSelect`, exposing the
 * resulting `loading`/`error`/`data` snapshot for `renderDetails`. Clicks the
 * gate rejects are ignored, so the previous detail and open state are kept.
 *
 * `loading` is derived (never set synchronously): it is `true` for an accepted
 * click until its own `onFeatureSelect` outcome arrives. Returns `null` while
 * the detail API is not configured or before the first accepted click.
 */
export const useFeatureDetail = (): GeovisWorkspaceDetailState | null => {
  const click = useGeoVisClick();
  const { config, setRightSidebarOpen } = useGeovisWorkspace();

  const rightSidebar = config.rightSidebar;
  const onFeatureSelect = rightSidebar?.onFeatureSelect;

  const activeClick = resolveActiveClick(click, rightSidebar?.shouldOpen);

  const [result, setResult] = React.useState<FetchResult | null>(null);

  // Whether this hook opened the sidebar for a click, so a later deselect can
  // close it — but only when the click (not the reopen button) opened it.
  const openedByClickRef = React.useRef(false);

  React.useEffect(() => {
    if (!onFeatureSelect) return;

    if (!activeClick) {
      // The selection cleared (e.g. a click outside any feature). If this hook
      // opened the sidebar for a click, close it so the open state — and
      // anything derived from it, like a legend pushed clear of the sidebar —
      // returns to rest, matching the explicit close button.
      if (openedByClickRef.current) {
        openedByClickRef.current = false;
        setRightSidebarOpen({ open: false });
      }
      return;
    }

    const key = clickIdentity(activeClick);
    setRightSidebarOpen({ open: true });
    openedByClickRef.current = true;

    let cancelled = false;

    onFeatureSelect(activeClick)
      .then((data) => {
        if (!cancelled) setResult({ key, error: null, data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key, error, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [activeClick, onFeatureSelect, setRightSidebarOpen]);

  if (!activeClick || !onFeatureSelect) return null;

  return toDetailState(result, clickIdentity(activeClick));
};
