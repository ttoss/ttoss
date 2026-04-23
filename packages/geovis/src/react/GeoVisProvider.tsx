import * as React from 'react';

import type { EngineAdapter, SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import type { PartialVisualizationSpec } from '../spec/applyDefaults';
import { applyDefaults, applyDefaultsAsync } from '../spec/applyDefaults';
import { expandLayerTemplates } from '../spec/expandLayerTemplates';
import type { VisualizationSpec } from '../spec/types';

interface GeoVisContextValue {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  applyPatch: (patch: SpecPatch) => void;
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
  /**
   * Visualization spec. Accepts either a fully-typed `VisualizationSpec` or a
   * minimal `PartialVisualizationSpec` (only `data` is required) — defaults
   * for `id`, `engine`, `view`, and `layers` are filled in by `applyDefaults`.
   */
  spec: VisualizationSpec | PartialVisualizationSpec;
  children: React.ReactNode;
}

/**
 * Provides a GeoVis runtime context for child components.
 * Resolves the appropriate engine adapter based on the spec's engine field,
 * initializes the runtime, and keeps it in sync with spec updates.
 * Throws any adapter initialization error as a React error boundary–catchable exception.
 */
export const GeoVisProvider = ({
  spec: rawSpec,
  children,
}: GeoVisProviderProps) => {
  // Synchronous initial spec (geojson-url entries default to polygon).
  const syncSpec = React.useMemo(() => {
    return expandLayerTemplates(applyDefaults(rawSpec));
  }, [rawSpec]);

  // `spec` state starts from the sync baseline and is refined asynchronously
  // when geojson-url entries need URL-based geometry inference.
  const [spec, setSpec] = React.useState<VisualizationSpec>(syncSpec);

  React.useEffect(() => {
    const data = rawSpec.data ?? [];
    const needsUrlInference =
      data.some((e) => {
        return e.kind === 'geojson-url';
      }) &&
      !rawSpec.layers?.length &&
      !rawSpec.layerTemplates?.length;

    if (!needsUrlInference) {
      setSpec(syncSpec);
      return;
    }

    // Show the polygon-defaulted spec immediately while the fetch is in flight.
    setSpec(syncSpec);

    let cancelled = false;
    applyDefaultsAsync(rawSpec).then((resolved) => {
      if (!cancelled) setSpec(expandLayerTemplates(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, [rawSpec, syncSpec]);
  const [runtime, setRuntime] = React.useState<GeoVisRuntime | null>(null);
  const [adapterError, setAdapterError] = React.useState<Error | null>(null);
  const [effectiveSpec, setEffectiveSpec] =
    React.useState<VisualizationSpec>(spec);
  const prevSpecRef = React.useRef<VisualizationSpec | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let activeRuntime: GeoVisRuntime | null = null;

    setAdapterError(null);

    const init = async () => {
      try {
        const adapter = await resolveAdapter(spec.engine);
        if (cancelled) return;
        activeRuntime = createRuntime(adapter, spec);
        // Do not set prevSpecRef here: the sync effect below is responsible
        // for tracking prevSpecRef and calling setEffectiveSpec. If we set it
        // here, the sync effect exits early (spec === prevSpecRef.current) and
        // effectiveSpec is never updated after an engine change.
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
    if (spec === prevSpecRef.current) return;
    prevSpecRef.current = spec;
    setEffectiveSpec(spec);
    runtime.update(spec);
  }, [runtime, spec]);

  const applyPatch = (patch: SpecPatch) => {
    if (!runtime) return;
    runtime.applyPatch(patch);
    setEffectiveSpec(runtime.spec);
  };

  if (adapterError) throw adapterError;

  return (
    <GeoVisContext.Provider
      value={{ runtime, spec: effectiveSpec, applyPatch }}
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
