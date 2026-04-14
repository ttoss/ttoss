import * as React from 'react';

import type { EngineAdapter, SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
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

  React.useEffect(() => {
    let cancelled = false;
    let activeRuntime: GeoVisRuntime | null = null;

    const init = async () => {
      try {
        const adapter = await resolveAdapter(spec.engine);
        if (cancelled) return;
        activeRuntime = createRuntime(adapter, spec);
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

  const specJsonRef = React.useRef<string>('');

  React.useEffect(() => {
    if (!runtime) return;
    const specJson = JSON.stringify(spec);
    if (specJson === specJsonRef.current) return;
    specJsonRef.current = specJson;
    runtime.update(spec);
  }, [runtime, spec]);

  const applyPatch = (patch: SpecPatch) => {
    runtime?.applyPatch(patch);
  };

  if (adapterError) throw adapterError;

  return (
    <GeoVisContext.Provider value={{ runtime, spec, applyPatch }}>
      {children}
    </GeoVisContext.Provider>
  );
};

export const useGeoVis = (): GeoVisContextValue => {
  const ctx = React.useContext(GeoVisContext);
  if (!ctx) throw new Error('useGeoVis must be used inside <GeoVisProvider>');
  return ctx;
};
