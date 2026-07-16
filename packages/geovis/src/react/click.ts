import type { MapClickInfo } from './contexts';

/**
 * Spec-driven click configuration declared on a `VisualizationLayer`.
 *
 * The click analogue of {@link HoverTooltipConfig}: a layer describes how it
 * reacts to clicks inline in the spec, and `<GeoVisProvider>` wires it up
 * automatically — the consumer neither places a component nor calls
 * `useGeoVisClick()` in the tree. Declaring `click` also opts the layer into
 * click tracking, so `activeLegendId` is not required.
 *
 * Kept in a data-only module (no React import) so the spec layer stays free of
 * a runtime React dependency, mirroring `react/tooltip.ts`.
 */
export interface LayerClickConfig {
  /**
   * Invoked when a feature on this layer is selected (clicked), and again with
   * `null` when the selection is cleared (Escape, or a click outside every
   * tracked layer). The spec-driven equivalent of reading `useGeoVisClick()`
   * inside a child of `<GeoVisProvider>`.
   */
  onSelect?: (info: MapClickInfo | null) => void;
}
