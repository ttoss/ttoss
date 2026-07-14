import * as React from 'react';

import type {
  EngineAdapter,
  SetViewOptions,
  SpecPatch,
} from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { createRuntime } from '../runtime/createRuntime';
import { resolveSpecFromMapType } from '../spec/mapTypeDefaults';
import type { GeoVisIssue, GeoVisResult } from '../spec/result';
import type { VisualizationSpec } from '../spec/types';
import { GeoVisHoverTooltip } from '../ui/GeoVisHoverTooltip';
import { GeoVisLegend } from '../ui/GeoVisLegend';
import {
  buildContainerStyle,
  groupLegendIdsByPosition,
} from '../ui/GeoVisLegend.utils';
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

/**
 * Extracts cartography policy violations from `spec.metadata` as `GeoVisIssue`s
 * (code `policy-violation`) — the same reporting channel as validation issues
 * (ADR-0001, D4). These are always warnings: they never block rendering.
 * When metadata already computed the normalized alternative, it becomes a
 * `set-value` repair; otherwise no repair is attached.
 */
const checkPolicies = (spec: VisualizationSpec): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const m = spec.metadata;

  if (!m) return issues;

  if (m.isPolicyInvalid === true) {
    const reason = (m.invalidReason as string | undefined) ?? 'policy-invalid';
    const metricField = m.metricField as string | undefined;
    const normalizedField =
      (m.normalizedField as string | undefined) ??
      (m.normalizedExpression as string | undefined);
    const label = m.normalizedLabel as string | undefined;

    let message = `Spec violates cartographic policy: ${reason}.`;
    if (metricField) message += ` Invalid field: '${metricField}'.`;
    if (normalizedField)
      message += ` Correct alternative: '${normalizedField}'`;
    if (label) message += ` (${label})`;
    message += '.';

    issues.push({
      code: 'policy-violation',
      subject: { path: 'metadata.metricField', id: reason },
      message,
      ...(normalizedField
        ? {
            repair: [
              {
                kind: 'set-value' as const,
                path: 'metadata.metricField',
                value: normalizedField,
                label: label
                  ? `Use '${normalizedField}' (${label})`
                  : `Use '${normalizedField}'`,
              },
            ],
          }
        : {}),
    });
  }

  return issues;
};

/** Merges policy issues into a resolved result's warnings; passes failure results through unchanged. */
const withPolicyWarnings = (result: GeoVisResult): GeoVisResult => {
  if (result.status !== 'resolved') return result;
  const policyIssues = checkPolicies(result.spec);
  if (policyIssues.length === 0) return result;
  return {
    status: 'resolved',
    spec: result.spec,
    warnings: [...result.warnings, ...policyIssues],
  };
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
 * recomputing `effectiveSpec`, `committed`, and the memoized context value.
 * By moving the hover state down, only this small component and the
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

  // The last spec/result the runtime actually accepted. Nothing renders on
  // failure (ADR-0001): `committed.spec` stays at its previous value while
  // `committed.result` surfaces whatever `validateSpec` rejected. Before a
  // runtime exists, there is nothing to validate against yet, so the initial
  // value is optimistic — the runtime's own construction-time validation
  // corrects it as soon as it becomes available.
  const [committed, setCommitted] = React.useState<{
    spec: VisualizationSpec;
    result: GeoVisResult;
  }>(() => {
    return {
      spec: resolvedSpec,
      result: withPolicyWarnings({
        status: 'resolved',
        spec: resolvedSpec,
        warnings: [],
      }),
    };
  });

  const legendPositionGroups = React.useMemo(() => {
    return groupLegendIdsByPosition(committed.spec);
  }, [committed.spec]);

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
    // runtime.update() is an imperative push into the external map/adapter
    // instance — it cannot run during render — and its synchronous return
    // value is exactly what `committed` must reflect, so this is the
    // "synchronize state with an external system" case the lint rule allows,
    // not state that could instead be derived at render time.
    const result = runtime.update(resolvedSpec);
    if (result.status === 'resolved') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommitted({ spec: result.spec, result: withPolicyWarnings(result) });
    } else {
      setCommitted((prev) => {
        return { spec: prev.spec, result };
      });
    }
  }, [runtime, resolvedSpec]);

  const applyPatch = React.useCallback(
    (patch: SpecPatch) => {
      if (!runtime) return;
      const result = runtime.applyPatch(patch);
      if (result.status === 'resolved') {
        setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
        setCommitted({
          spec: result.spec,
          result: withPolicyWarnings(result),
        });
      } else {
        setCommitted((prev) => {
          return { spec: prev.spec, result };
        });
      }
    },
    [runtime, spec]
  );

  const setView = React.useCallback(
    (options: SetViewOptions) => {
      if (!runtime) return;
      runtime.setView(options);
      setPatchState({ forSpec: spec, patchedSpec: runtime.spec });
      setCommitted((prev) => {
        return { ...prev, spec: runtime.spec };
      });
    },
    [runtime, spec]
  );

  if (adapterError) throw adapterError;

  // Memoize the context value so that high-frequency hover updates inside
  // `HoverProvider` (a child component) cannot cascade into re-renders of
  // `useGeoVis()` consumers. Reference equality of `value` is the signal
  // React uses to notify context subscribers — keeping it stable when
  // runtime/spec/applyPatch/result are unchanged is critical here.
  const ctxValue = React.useMemo(() => {
    return {
      runtime,
      spec: committed.spec,
      applyPatch,
      setView,
      result: committed.result,
    };
  }, [runtime, committed, applyPatch, setView]);

  return (
    <GeoVisContext.Provider value={ctxValue}>
      <ClickProvider runtime={runtime} spec={committed.spec}>
        <HoverProvider runtime={runtime} spec={committed.spec}>
          {children}
        </HoverProvider>
      </ClickProvider>
      {/* Spec-driven legend overlays: mount one <GeoVisLegend> per positioned
          legend so consumers get the overlay just by declaring `position` on
          a legend, exactly like the auto-mounted hoverTooltip. Legends
          sharing a position stack inside one grouped container instead of
          overlapping as separate absolutely-positioned boxes. */}
      {Array.from(legendPositionGroups.entries()).flatMap(([position, ids]) => {
        if (ids.length <= 1) {
          return ids.map((id) => {
            return <GeoVisLegend key={id} legendId={id} />;
          });
        }
        return (
          <div key={position} style={buildContainerStyle(position)}>
            {ids.map((id) => {
              return <GeoVisLegend key={id} legendId={id} noPositionWrap />;
            })}
          </div>
        );
      })}
    </GeoVisContext.Provider>
  );
};
