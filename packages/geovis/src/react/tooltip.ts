import type { GeoVisHoverTooltipProps } from '../ui/GeoVisHoverTooltip';

/**
 * Spec-driven hover tooltip configuration declared on a `VisualizationLayer`.
 *
 * @remarks
 * Mirrors {@link GeoVisHoverTooltipProps} so a layer can describe its tooltip
 * inline in the spec — the `<GeoVisProvider>` renders a `<GeoVisHoverTooltip>`
 * automatically for features on that layer, without the consumer placing the
 * component in the tree. `children` is omitted because arbitrary JSX children
 * have no meaning in a (frontend-built) spec; use `render` instead.
 */
export type HoverTooltipConfig = Omit<GeoVisHoverTooltipProps, 'children'>;
