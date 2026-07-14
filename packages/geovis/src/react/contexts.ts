import * as React from 'react';

import type { SetViewOptions, SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { GeoVisResult } from '../spec/result';
import type { VisualizationSpec } from '../spec/types';

/**
 * Snapshot of a feature currently hovered on the map.
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
  /**
   * Viewport-absolute pixel coordinates of the cursor (`clientX / clientY`
   * equivalent). Use these directly with `position: fixed` elements such as
   * `<GeoVisHoverTooltip>`, which renders via a portal into `document.body`.
   */
  point: { x: number; y: number };
}

export interface GeoVisContextValue {
  runtime: GeoVisRuntime | null;
  /** The last successfully accepted spec — unchanged while `result` is a failure (ADR-0001: nothing renders on failure). */
  spec: VisualizationSpec;
  applyPatch: (patch: SpecPatch) => void;
  /** Imperatively moves the camera and syncs `spec.view`. Animated by default. */
  setView: (options: SetViewOptions) => void;
  /**
   * The latest `GeoVisResult` from validating the spec (schema, referential
   * integrity, and adapter capabilities) plus cartography policy warnings.
   * `resolved.warnings` carries policy violations — they never block
   * rendering. Any other status means `spec` still reflects the last good
   * value and the map was not updated.
   */
  result: GeoVisResult;
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

/**
 * Snapshot of a feature clicked on the map. Unlike {@link MapHoverInfo}, this
 * persists until dismissed (another click or Escape). Includes `lngLat` (the
 * geographic coordinates of the click) so consumers can anchor popups to a
 * stable map position instead of tracking the cursor.
 */
export interface MapClickInfo {
  /** Layer id that received the click. */
  layerId: string;
  /** Source id backing the layer. */
  sourceId: string;
  /** Clicked feature's id (typically `geometryId` from `mapData`). */
  featureId: string | number;
  /**
   * `feature-state.value` at click time; same semantics as
   * {@link MapHoverInfo.value}.
   */
  value: number | string | null;
  /** Geographic coordinates `[lng, lat]` of the click. */
  lngLat: [number, number];
  /** Canvas-relative pixel coordinates of the click. */
  point: { x: number; y: number };
}

/**
 * Persistent click snapshot context.
 *
 * @remarks
 * Default value is `undefined` (the "no provider" sentinel) so
 * {@link useGeoVisClick} can distinguish "consumed outside `GeoVisProvider`"
 * from the valid "no feature clicked" state (`null`). Kept separate from
 * {@link GeoVisHoverContext} because click frequency is much lower and the
 * two states are independent.
 */
export const GeoVisClickContext = React.createContext<
  MapClickInfo | null | undefined
>(undefined);

/**
 * Returns the last clicked feature on the active map, or `null` when no
 * feature is selected. This hook only populates when the user clicks a
 * feature on a layer configured with `activeLegendId`, and the clicked
 * feature has an id. Clears to `null` when the user presses Escape or
 * clicks outside those layers/features.
 * Must be called inside `<GeoVisProvider>`.
 */
export const useGeoVisClick = (): MapClickInfo | null => {
  const ctx = React.useContext(GeoVisClickContext);
  if (ctx === undefined) {
    throw new Error('useGeoVisClick must be used inside <GeoVisProvider>');
  }
  return ctx;
};
