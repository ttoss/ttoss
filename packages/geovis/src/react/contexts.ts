import * as React from 'react';

import type { SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { PolicyViolation, VisualizationSpec } from '../spec/types';

/**
 * Snapshot of a feature currently hovered on the map. Coordinates are pixel
 * offsets relative to the map canvas, so consumers can render overlays inside
 * the same `position: relative` container that hosts `<GeoVisCanvas>`.
 */
export interface MapHoverInfo {
  /** Layer id under the cursor. */
  layerId: string;
  /** Source id backing the layer (kept so consumers can re-query feature-state). */
  sourceId: string;
  /** Hovered feature's id (typically `geometryId` from `mapData`). */
  featureId: string | number;
  /**
   * `feature-state.value` (set by `mapData`); supports the same value types
   * as `MapDataRow.value` (`number | string | null`). `null` when the feature
   * has no value bound or when the bound value is a non-finite number.
   */
  value: number | string | null;
  /** Pixel coordinates relative to the map canvas. */
  point: { x: number; y: number };
}

export interface GeoVisContextValue {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  applyPatch: (patch: SpecPatch) => void;
  /** Policy violations detected from spec.metadata on mount. Empty when spec is valid. */
  policyViolations: PolicyViolation[];
}

/**
 * Context exposing the active GeoVis runtime, spec, and patch dispatcher.
 *
 * @remarks
 * Lives in a dedicated module (separate from `GeoVisProvider`) so that hooks
 * such as `useMapData` can consume it without creating a circular dependency
 * with the provider, which in turn imports hover-tracking helpers from
 * `./hooks`.
 */
export const GeoVisContext = React.createContext<GeoVisContextValue | null>(
  null
);

/**
 * Returns the active {@link GeoVisContextValue}. Throws when called outside a
 * `<GeoVisProvider>` so misuses fail loudly during development instead of
 * silently rendering with `null` runtime/spec.
 */
export const useGeoVis = (): GeoVisContextValue => {
  const ctx = React.useContext(GeoVisContext);
  if (!ctx) throw new Error('useGeoVis must be used inside <GeoVisProvider>');
  return ctx;
};

/**
 * High-frequency hover snapshot context.
 *
 * @remarks
 * Default value is `undefined` (the "no provider" sentinel) so
 * {@link useGeoVisHover} can distinguish "consumed outside `GeoVisProvider`"
 * from the valid "no feature hovered" state (`null`). Kept separate from
 * {@link GeoVisContext} so `mousemove` updates do not re-render
 * `useGeoVis()` consumers (which only need stable runtime/spec values).
 */
export const GeoVisHoverContext = React.createContext<
  MapHoverInfo | null | undefined
>(undefined);

/**
 * Returns the live hover snapshot for the active map. Updates on every
 * `mousemove`/`mouseleave` over polygon layers with `activeLegendId`.
 * Must be called inside `<GeoVisProvider>`.
 */
export const useGeoVisHover = (): MapHoverInfo | null => {
  const ctx = React.useContext(GeoVisHoverContext);
  if (ctx === undefined) {
    throw new Error('useGeoVisHover must be used inside <GeoVisProvider>');
  }
  return ctx;
};
