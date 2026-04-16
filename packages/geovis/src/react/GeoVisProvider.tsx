import * as React from 'react';

import type { EngineAdapter, SpecPatch } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import type { PolicyViolation, VisualizationSpec } from '../spec/types';

/**
 * Evaluates spec.metadata for known policy violations.
 * Called once per spec on Provider mount — not on every update,
 * because metadata is treated as static fixture-level contract.
 * Returns an empty array when no violations are found.
 */
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

  // Computed once from the initial spec — metadata is a static fixture contract.
  const policyViolations = React.useMemo(() => {
    return checkPolicies(spec);
  }, [spec.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    let cancelled = false;
    let activeRuntime: GeoVisRuntime | null = null;

    setAdapterError(null);

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

  const prevSpecRef = React.useRef<VisualizationSpec | null>(null);

  React.useEffect(() => {
    if (!runtime) return;
    if (spec === prevSpecRef.current) return;
    prevSpecRef.current = spec;
    runtime.update(spec);
  }, [runtime, spec]);

  const applyPatch = (patch: SpecPatch) => {
    runtime?.applyPatch(patch);
  };

  if (adapterError) throw adapterError;

  return (
    <GeoVisContext.Provider
      value={{ runtime, spec, applyPatch, policyViolations }}
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
