import * as React from 'react';

import type {
  EngineAdapter,
  SetViewOptions,
  SpecPatch,
} from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import { resolveSpecFromMapType } from '../spec/mapTypeDefaults';
import type { PolicyViolation, VisualizationSpec } from '../spec/types';
import { GeoVisHoverTooltip } from '../ui/GeoVisHoverTooltip';
import { GeoVisLegend } from '../ui/GeoVisLegend';
import {
  GeoVisClickContext,
  GeoVisContext,
  GeoVisHoverContext,
} from './contexts';
import { useClickAnchor, useMapClick, useMapHover } from './hooks';

// Re-export the contexts and hooks so existing public-API consumers
// (`@ttoss/geovis` re-exports `./react/GeoVisProvider`) keep working after
// the contexts module was extracted to break the hooks/provider cycle.
export type {
  GeoVisContextValue,
  MapClickInfo,
  MapHoverInfo,
} from './contexts';
export {
  GeoVisClickContext,
  GeoVisContext,
  GeoVisHoverContext,
  useGeoVis,
  useGeoVisClick,
  useGeoVisHover,
} from './contexts';

/** Extracts policy violations from `spec.metadata`. Returns an empty array when the spec is valid. */
const checkPolicies = (spec: VisualizationSpec): PolicyViolation[] => {
  const violations: PolicyViolation[] = [];
  const m = spec.metadata;

  if (!m) return violations;

  if (m.isPolicyInvalid === true) {
    const reason = (m.invalidReason as string | undefined) ?? 'policy-invalid';
    const metricField = m.metricField as string | undefined;
    const normalizedField =
      (m.normalizedField as string | undefined) ??
      (m.normalizedExpression as string | undefined);
    const label = m.normalizedLabel as string | undefined;

    let message = `Spec '${spec.id}' violates cartographic policy: ${reason}.`;
    if (metricField) message += ` Invalid field: '${metricField}'.`;
    if (normalizedField)
      message += ` Correct alternative: '${normalizedField}'`;
    if (label) message += ` (${label})`;
    message += '.';

    violations.push({ reason, message });
  }

  return violations;
};

/**
 * Collects the ids of every legend that declares a `position`. A positioned
 * legend is meant to overlay the map, so the provider mounts a
 * `<GeoVisLegend>` for it automatically — mirroring the auto-mounted
 * `hoverTooltip` — and consumers do not place it by hand. Scans both the
 * top-level `spec.legends` registry and per-layer `legends`.
 */
const collectPositionedLegendIds = (spec: VisualizationSpec): string[] => {
  const ids = new Set<string>();
  for (const legend of spec.legends ?? []) {
    if (legend.position) ids.add(legend.id);
  }
  for (const layer of spec.layers) {
    for (const legend of layer.legends ?? []) {
      if (legend.position) ids.add(legend.id);
    }
  }
  return Array.from(ids);
};

const resolveAdapter = async (
  engine: VisualizationSpec['engine']
): Promise<EngineAdapter> => {
  switch (engine) {
    case 'maplibre': {
      const mod = await import('../adapters/maplibre/MapLibreAdapter');
      return mod.default();
    }
    default:
      throw new Error(`[GeoVis] Unsupported engine: ${engine}`);
  }
};

interface GeoVisProviderProps {
  spec: VisualizationSpec;
  children: React.ReactNode;
}

/**
 * Isolates `useMapClick` into a child component so that click-state updates
 * do NOT re-render `GeoVisProvider`.
 *
 * @remarks
 * Wraps `HoverProvider` in the tree. When click state changes, `HoverProvider`
 * re-executes, but because `hover` state is a stable reference until a
 * `mousemove` fires, `GeoVisHoverContext` consumers will not re-render on
 * click events. Defined at module scope for the same stability reason as
 * `HoverProvider`.
 */
const ClickProvider = ({
  runtime,
  spec,
  children,
}: {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  children: React.ReactNode;
}) => {
  const clickedMapFeature = useMapClick({ runtime, spec });
  useClickAnchor({ runtime, spec, click: clickedMapFeature });
  return (
    <GeoVisClickContext.Provider value={clickedMapFeature}>
      {children}
    </GeoVisClickContext.Provider>
  );
};

/**
 * Isolates `useMapHover` (which fires on every `mousemove`) into a child
 * component so that its state updates do NOT re-render `GeoVisProvider`.
 *
 * @remarks
 * Defined at module scope so its component identity is stable across
 * re-renders of `GeoVisProvider` (defining it inside would remount the
 * subtree on every render and defeat the optimization). Without this
 * boundary, every hover event would re-execute the parent's render body —
 * recomputing `effectiveSpec`, `policyViolations`, and the memoized context
 * value. By moving the hover state down, only this small component and the
 * consumers of `useGeoVisHover()` re-render on hover.
 */
const HoverProvider = ({
  runtime,
  spec,
  children,
}: {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  children: React.ReactNode;
}) => {
  const hoveredMapFeature = useMapHover({ runtime, spec });
  // Spec-driven tooltip: render a <GeoVisHoverTooltip> automatically for the
  // layer under the cursor when it declares `hoverTooltip`, so consumers do
  // not have to place the component manually. The component reads the live
  // snapshot from `useGeoVisHover()` itself; mounting it is enough.
  const hoverTooltip = hoveredMapFeature
    ? spec.layers.find((layer) => {
        return layer.id === hoveredMapFeature.layerId;
      })?.hoverTooltip
    : undefined;
  return (
    <GeoVisHoverContext.Provider value={hoveredMapFeature}>
      {children}
      {hoverTooltip && <GeoVisHoverTooltip {...hoverTooltip} />}
    </GeoVisHoverContext.Provider>
  );
};

/**
 * Provides a GeoVis runtime context for child components.
 * Resolves the appropriate engine adapter based on the spec's engine field,
 * initializes the runtime, and keeps it in sync with spec updates.
 * Throws any adapter initialization error as a React error boundary–catchable exception.
 */
export const GeoVisProvider = ({ spec, children }: GeoVisProviderProps) => {
  const [runtime, setRuntime] = React.useState<GeoVisRuntime | null>(null);
  const [adapterError, setAdapterError] = React.useState<Error | null>(null);
  const [patchState, setPatchState] = React.useState<{
    forSpec: VisualizationSpec;
    patchedSpec: VisualizationSpec | null;
  }>({ forSpec: spec, patchedSpec: null });

  // Pure derivation — no setState during render. When the parent provides a
  // new `spec` reference, `patchState.forSpec !== spec` makes `effectiveSpec`
  // fall through to the fresh prop; stale patches are automatically ignored.
  const effectiveSpec =
    patchState.forSpec === spec ? (patchState.patchedSpec ?? spec) : spec;

  // Resolve mapType shorthand (e.g. choropleth → layers + legends + colorBy)
  // synchronously so context consumers always see the fully-resolved spec.
  const resolvedSpec = React.useMemo(() => {
    return resolveSpecFromMapType(effectiveSpec);
  }, [effectiveSpec]);

  const policyViolations = React.useMemo(() => {
    return checkPolicies(effectiveSpec);
  }, [effectiveSpec]);

  const positionedLegendIds = React.useMemo(() => {
    return collectPositionedLegendIds(resolvedSpec);
  }, [resolvedSpec]);

  React.useEffect(() => {
    let cancelled = false;
    let activeRuntime: GeoVisRuntime | null = null;

    const init = async () => {
      try {
        const adapter = await resolveAdapter(spec.engine);
        if (cancelled) return;
        activeRuntime = createRuntime(adapter, spec);
        setAdapterError(null);
        setRuntime(activeRuntime);
      } catch (error) {
        if (cancelled) return;
        setAdapterError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    init();

    return () => {
      cancelled = true;
      activeRuntime?.destroy();
      setRuntime(null);
    };
    // Re-create runtime when the engine changes, not on every spec update.
    // Spec updates reach the runtime via runtime.update() instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.engine]);

  React.useEffect(() => {
    if (!runtime) return;
    runtime.update(spec);
  }, [runtime, spec]);

  const applyPatch = React.useCallback(
    (patch: SpecPatch) => {
      if (!runtime) return;
      runtime.applyPatch(patch);
      setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
    },
    [runtime, spec]
  );

  const setView = React.useCallback(
    (options: SetViewOptions) => {
      if (!runtime) return;
      runtime.setView(options);
      setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
    },
    [runtime, spec]
  );

  if (adapterError) throw adapterError;

  // Memoize the context value so that high-frequency hover updates inside
  // `HoverProvider` (a child component) cannot cascade into re-renders of
  // `useGeoVis()` consumers. Reference equality of `value` is the signal
  // React uses to notify context subscribers — keeping it stable when
  // runtime/spec/applyPatch/violations are unchanged is critical here.
  const ctxValue = React.useMemo(() => {
    return {
      runtime,
      spec: resolvedSpec,
      applyPatch,
      setView,
      policyViolations,
    };
  }, [runtime, resolvedSpec, applyPatch, setView, policyViolations]);

  return (
    <GeoVisContext.Provider value={ctxValue}>
      <ClickProvider runtime={runtime} spec={resolvedSpec}>
        <HoverProvider runtime={runtime} spec={resolvedSpec}>
          {children}
        </HoverProvider>
      </ClickProvider>
      {/* Spec-driven legend overlays: mount one <GeoVisLegend> per positioned
          legend so consumers get the overlay just by declaring `position` on
          a legend, exactly like the auto-mounted hoverTooltip. */}
      {positionedLegendIds.map((id) => {
        return <GeoVisLegend key={id} legendId={id} />;
      })}
    </GeoVisContext.Provider>
  );
};
