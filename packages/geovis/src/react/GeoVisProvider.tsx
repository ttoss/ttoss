import * as React from 'react';

import type {
  EngineAdapter,
  SetViewOptions,
  SpecPatch,
} from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import type { PolicyViolation, VisualizationSpec } from '../spec/types';

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
  /** Imperatively moves the camera and syncs `spec.view`. Animated by default. */
  setView: (options: SetViewOptions) => void;
  /** Policy violations detected from spec.metadata on mount. Empty when spec is valid. */
  policyViolations: PolicyViolation[];
}

export const GeoVisContext = React.createContext<GeoVisContextValue | null>(
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

  const applyPatch = (patch: SpecPatch) => {
    if (!runtime) return;
    runtime.applyPatch(patch);
    setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
  };

  const setView = (options: SetViewOptions) => {
    if (!runtime) return;
    runtime.setView(options);
    setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
  };

  if (adapterError) throw adapterError;

  return (
    <GeoVisContext.Provider
      value={{
        runtime,
        spec: effectiveSpec,
        applyPatch,
        setView,
        policyViolations,
      }}
    >
      {children}
    </GeoVisContext.Provider>
  );
};

export const useGeoVis = (): GeoVisContextValue => {
  const ctx = React.useContext(GeoVisContext);
  if (!ctx) throw new Error('useGeoVis must be used inside <GeoVisProvider>');
  return ctx;
};

export interface UseMapDataResult {
  mapDataId: string;
  mapId: string;
  joinKey?: string;
  /** Indexed lookup: stringified `geometryId` → `value`. */
  values: Map<string, number | string | null>;
  /** The `data` array as declared in the spec, in original order. */
  rows: ReadonlyArray<{
    geometryId: string | number;
    value: number | string | null;
  }>;
}

/**
 * Returns the indexed dataset entry for `mapDataId`, or `undefined` if
 * the spec has no matching `mapData[]` entry. Re-renders when the spec
 * changes (including via `applyPatch`).
 *
 * Must be used inside a {@link GeoVisProvider}.
 */
export const useMapData = (mapDataId: string): UseMapDataResult | undefined => {
  const { spec } = useGeoVis();
  return React.useMemo(() => {
    const md = spec.mapData?.find((entry) => {
      return entry.mapDataId === mapDataId;
    });
    if (!md) return undefined;
    const values = new Map<string, number | string | null>();
    for (const row of md.data) {
      values.set(String(row.geometryId), row.value);
    }
    return {
      mapDataId: md.mapDataId,
      mapId: md.mapId,
      joinKey: md.joinKey,
      values,
      rows: md.data,
    };
  }, [spec, mapDataId]);
};
