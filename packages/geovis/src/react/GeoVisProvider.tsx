import * as React from 'react';

import type { EngineAdapter, SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import type { PolicyViolation, VisualizationSpec } from '../spec/types';
import type { MapHoverInfo } from './hooks';
import { useMapHover } from './hooks';

export { useMapData } from './hooks';

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

interface GeoVisContextValue {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  applyPatch: (patch: SpecPatch) => void;
  /** Policy violations detected from spec.metadata on mount. Empty when spec is valid. */
  policyViolations: PolicyViolation[];
}

export const GeoVisContext = React.createContext<GeoVisContextValue | null>(
  null
);

/**
 * Snapshot of the feature currently hovered on the map (only tracked for
 * polygon layers with `activeLegendId`). `null` when no feature is hovered.
 *
 * Lives in a dedicated context so high-frequency `mousemove` updates do not
 * re-render `useGeoVis()` consumers (which only need the stable runtime/spec).
 */
export const GeoVisHoverContext = React.createContext<MapHoverInfo | null>(
  null
);

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

  const policyViolations = React.useMemo(() => {
    return checkPolicies(effectiveSpec);
  }, [effectiveSpec]);

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
    // Re-create runtime only when the engine changes, not on every spec update.
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

  if (adapterError) throw adapterError;

  // Memoize the context value so that high-frequency hover updates inside
  // `HoverProvider` (a child component) cannot cascade into re-renders of
  // `useGeoVis()` consumers. Reference equality of `value` is the signal
  // React uses to notify context subscribers — keeping it stable when
  // runtime/spec/applyPatch/violations are unchanged is critical here.
  const ctxValue = React.useMemo(() => {
    return {
      runtime,
      spec: effectiveSpec,
      applyPatch,
      policyViolations,
    };
  }, [runtime, effectiveSpec, applyPatch, policyViolations]);

  return (
    <GeoVisContext.Provider value={ctxValue}>
      <HoverProvider runtime={runtime} spec={effectiveSpec}>
        {children}
      </HoverProvider>
    </GeoVisContext.Provider>
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
  return (
    <GeoVisHoverContext.Provider value={hoveredMapFeature}>
      {children}
    </GeoVisHoverContext.Provider>
  );
};

export const useGeoVis = (): GeoVisContextValue => {
  const ctx = React.useContext(GeoVisContext);
  if (!ctx) throw new Error('useGeoVis must be used inside <GeoVisProvider>');
  return ctx;
};

/**
 * Returns the live hover snapshot for the active map. Updates on every
 * `mousemove`/`mouseleave` over polygon layers with `activeLegendId`.
 * Must be called inside `GeoVisProvider`.
 */
export const useGeoVisHover = (): MapHoverInfo | null => {
  return React.useContext(GeoVisHoverContext);
};
