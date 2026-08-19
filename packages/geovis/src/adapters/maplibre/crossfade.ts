import type maplibregl from 'maplibre-gl';

import type {
  GeoJSONSource,
  LayerTransition,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';
import { stripUndefinedPaint, toMaplibreLayer } from './layerTranslation';
import { resolveSourceLayerFor } from './syncSourcesAndLayers';

/** Prefix for shadow layer ids. Reserved so reconcile passes never touch them. */
const SHADOW_LAYER_PREFIX = '__xf-';
/** Prefix for shadow source ids. Reserved so reconcile passes never touch them. */
const SHADOW_SOURCE_PREFIX = '__xf-src-';

const DEFAULT_DURATION_MS = 400;
const DEFAULT_EASING: NonNullable<LayerTransition['easing']> = 'ease-out';

/**
 * Frame scheduler abstraction so `startCrossfade` is deterministically
 * testable. Production uses `performance.now`/`requestAnimationFrame`; tests
 * inject a manual implementation to drive frames one at a time.
 *
 * @example
 * ```ts
 * const scheduler: CrossfadeScheduler = {
 *   now: () => Date.now(),
 *   raf: (cb) => requestAnimationFrame(cb),
 *   caf: (handle) => cancelAnimationFrame(handle),
 * };
 * ```
 */
export interface CrossfadeScheduler {
  /** Current timestamp in milliseconds. */
  now: () => number;
  /** Schedules `cb` for the next frame; returns a cancellation handle. */
  raf: (cb: (timestamp: number) => void) => number;
  /** Cancels a previously scheduled frame by its handle. */
  caf: (handle: number) => void;
}

const defaultScheduler: CrossfadeScheduler = {
  now: () => {
    return performance.now();
  },
  raf: (cb) => {
    return requestAnimationFrame(cb);
  },
  caf: (handle) => {
    cancelAnimationFrame(handle);
  },
};

/** One in-flight crossfade animation's teardown handle, per real layer id. */
interface XfEntry {
  shadowLayerId: string;
  shadowSourceId: string;
  /** Cancels the pending frame and removes the shadow, restoring real opacity. */
  stop: () => void;
}

const store = new WeakMap<maplibregl.Map, Map<string, XfEntry>>();

const entriesFor = (map: maplibregl.Map): Map<string, XfEntry> => {
  const existing = store.get(map);
  if (existing) return existing;
  const created = new Map<string, XfEntry>();
  store.set(map, created);
  return created;
};

/**
 * Resolves an easing name to its progress-mapping function `(t) => eased`.
 * Input and output are both in `[0, 1]`.
 *
 * @param name - Easing curve name.
 * @returns A pure function mapping linear progress to eased progress.
 *
 * @example
 * ```ts
 * resolveEasing('ease-out')(0.5); // 0.75
 * resolveEasing('linear')(0.5); // 0.5
 * ```
 */
export const resolveEasing = (
  name: NonNullable<LayerTransition['easing']>
): ((t: number) => number) => {
  if (name === 'linear') {
    return (t) => {
      return t;
    };
  }
  if (name === 'ease-in-out') {
    return (t) => {
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    };
  }
  return (t) => {
    return 1 - (1 - t) ** 2;
  };
};

/** Removes a shadow layer + source if present. Never throws. */
const removeShadow = (
  map: maplibregl.Map,
  shadowLayerId: string,
  shadowSourceId: string
): void => {
  if (map.getLayer(shadowLayerId)) map.removeLayer(shadowLayerId);
  if (map.getSource(shadowSourceId)) map.removeSource(shadowSourceId);
};

/** Sets both circle opacities on a layer, guarding for existence. */
const setCircleOpacities = (
  map: maplibregl.Map,
  layerId: string,
  circleOpacity: number,
  strokeOpacity: number
): void => {
  if (!map.getLayer(layerId)) return;
  map.setPaintProperty(layerId, 'circle-opacity', circleOpacity);
  map.setPaintProperty(layerId, 'circle-stroke-opacity', strokeOpacity);
};

/**
 * Disables MapLibre's built-in paint-property transition on the opacity
 * properties this crossfade drives frame-by-frame.
 *
 * MapLibre applies a default ~300ms ease to every `setPaintProperty` on a
 * transitionable property (`circle-opacity`, `circle-stroke-opacity`). Left
 * enabled, that internal ease fights the per-frame values the rAF loop writes:
 * the rendered opacity lags ~300ms behind the animation and, when the shadow is
 * removed on completion, the old points vanish abruptly instead of finishing
 * their fade. Forcing `duration: 0` makes each frame's value authoritative so
 * the manual crossfade is the only animation in play.
 */
const disableOpacityTransitions = (
  map: maplibregl.Map,
  layerId: string
): void => {
  if (!map.getLayer(layerId)) return;
  map.setPaintProperty(layerId, 'circle-opacity-transition', { duration: 0 });
  map.setPaintProperty(layerId, 'circle-stroke-opacity-transition', {
    duration: 0,
  });
};

interface StartCrossfadeArgs {
  layer: VisualizationLayer;
  /** Id of the real source whose data change triggered the crossfade. */
  sourceId: string;
  /** The NEW data — held by the shadow (fading in) and committed to the real source on completion. */
  newData: GeoJSONSource['data'];
  durationMs: number;
  easing: NonNullable<LayerTransition['easing']>;
  spec: VisualizationSpec;
}

/** Adds the shadow source + layer holding the NEW data at the layer's base paint. */
const addShadow = (
  map: maplibregl.Map,
  args: { layer: VisualizationLayer; data: GeoJSONSource['data'] } & {
    shadowLayerId: string;
    shadowSourceId: string;
    spec: VisualizationSpec;
  }
): void => {
  const { layer, data, shadowLayerId, shadowSourceId, spec } = args;
  map.addSource(shadowSourceId, {
    type: 'geojson',
    data: data as maplibregl.GeoJSONSourceSpecification['data'],
  });
  const shadowSpec = toMaplibreLayer(
    layer,
    resolveSourceLayerFor(spec, layer),
    spec.legends,
    spec.mapData,
    spec.scaleMaxValue
  );
  const shadowWithIds = {
    ...shadowSpec,
    id: shadowLayerId,
    source: shadowSourceId,
  } as maplibregl.LayerSpecification;
  stripUndefinedPaint(shadowWithIds);
  map.addLayer(shadowWithIds);
};

/** Resolves the layer's base circle fill opacity (stroke base is always 1). */
const resolveCircleBase = (layer: VisualizationLayer): number => {
  const circlePaint = layer.paint as { circleOpacity?: number } | undefined;
  return circlePaint?.circleOpacity ?? 1;
};

/** Max frames to wait for the real source to parse the new data before revealing it anyway. */
const SETTLE_MAX_FRAMES = 120;

/**
 * Starts a crossfade for one point layer.
 *
 * The already-rendered real layer keeps the OLD (already-parsed) data and fades
 * OUT, while a shadow layer holding the NEW data fades IN from zero. Fading the
 * OLD data out on the layer that is already on screen avoids the flash the
 * reverse suffers: a freshly added source must round-trip through MapLibre's
 * geojson worker before it renders, so a fade-out layer built from new data
 * blinks in late. Because the shadow (new data) starts fully transparent, its
 * own parse delay is invisible.
 *
 * On completion the NEW data is committed to the real source (this is why the
 * caller must NOT have applied it yet), and the real layer is only restored to
 * full opacity once that source has parsed — kept covered by the still-full
 * shadow until then, so the swap is seamless. Cancels and replaces any
 * crossfade already running for the same layer id.
 *
 * @param map - Live MapLibre map instance.
 * @param args - Layer, its source id, the new data, resolved duration/easing,
 *   and the spec used to translate the shadow layer paint.
 * @param scheduler - Frame scheduler; defaults to rAF/`performance.now`.
 * @returns Nothing; mutates the map and registers teardown state.
 *
 * @example
 * ```ts
 * startCrossfade(map, {
 *   layer,
 *   sourceId: 'points',
 *   newData: nextFeatureCollection,
 *   durationMs: 400,
 *   easing: 'ease-out',
 *   spec,
 * });
 * ```
 */
export const startCrossfade = (
  map: maplibregl.Map,
  args: StartCrossfadeArgs,
  scheduler: CrossfadeScheduler = defaultScheduler
): void => {
  const { layer, sourceId, newData, durationMs, easing, spec } = args;
  const entries = entriesFor(map);

  // Cancel any crossfade already running for this layer.
  const previous = entries.get(layer.id);
  if (previous) previous.stop();

  const shadowSourceId = `${SHADOW_SOURCE_PREFIX}${layer.id}`;
  const shadowLayerId = `${SHADOW_LAYER_PREFIX}${layer.id}`;

  // Defensive: clear any leftover shadow before recreating it.
  removeShadow(map, shadowLayerId, shadowSourceId);

  if (!map.getLayer(layer.id)) return;

  addShadow(map, { layer, data: newData, shadowLayerId, shadowSourceId, spec });

  // Take exclusive control of the opacity animation: without this, MapLibre's
  // default paint transition smears and lags the per-frame values below.
  disableOpacityTransitions(map, layer.id);
  disableOpacityTransitions(map, shadowLayerId);

  const circleBase = resolveCircleBase(layer);
  const strokeBase = 1;

  const ease = resolveEasing(easing);
  const start = scheduler.now();
  let frame: number | undefined;
  let settleFrames = 0;

  // Start: real layer (OLD data) fully visible, shadow (NEW data) transparent.
  setCircleOpacities(map, layer.id, circleBase, strokeBase);
  setCircleOpacities(map, shadowLayerId, 0, 0);

  /** Points the real source at the NEW data (deferred by the caller until now). */
  const commitNewData = (): void => {
    const source = map.getSource(sourceId) as
      maplibregl.GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      source.setData(newData as maplibregl.GeoJSONSourceSpecification['data']);
    }
  };

  const finalize = (): void => {
    setCircleOpacities(map, layer.id, circleBase, strokeBase);
    removeShadow(map, shadowLayerId, shadowSourceId);
    entries.delete(layer.id);
  };

  /**
   * Reveals the real layer only once its source has parsed the new data, so the
   * shadow keeps covering the gap. `setData` marks the source unloaded until the
   * worker responds, so an immediate check reflects the real state.
   */
  const settle = (): void => {
    const loaded =
      typeof map.isSourceLoaded !== 'function' || map.isSourceLoaded(sourceId);
    if (loaded || settleFrames >= SETTLE_MAX_FRAMES) {
      finalize();
      return;
    }
    settleFrames += 1;
    frame = scheduler.raf(settle);
  };

  const stop = (): void => {
    if (frame !== undefined) scheduler.caf(frame);
    commitNewData();
    finalize();
  };

  entries.set(layer.id, { shadowLayerId, shadowSourceId, stop });

  const tick = (): void => {
    const elapsed = scheduler.now() - start;
    const p = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
    const e = ease(p);
    // Real (OLD data) fades out; shadow (NEW data) fades in.
    setCircleOpacities(
      map,
      layer.id,
      circleBase * (1 - e),
      strokeBase * (1 - e)
    );
    setCircleOpacities(map, shadowLayerId, circleBase * e, strokeBase * e);
    if (p >= 1) {
      // Real layer is now invisible; swap its source and wait for the parse.
      commitNewData();
      settle();
      return;
    }
    frame = scheduler.raf(tick);
  };

  frame = scheduler.raf(tick);
};

const findGeojsonData = (
  spec: VisualizationSpec,
  sourceId: string
): GeoJSONSource['data'] | undefined => {
  const source = spec.sources.find((s) => {
    return s.id === sourceId;
  });
  return source?.type === 'geojson' ? source.data : undefined;
};

/** One layer's resolved crossfade parameters, produced by {@link planCrossfades}. */
export interface CrossfadePlan {
  layer: VisualizationLayer;
  /** Source whose `setData` must be deferred until the crossfade commits it. */
  sourceId: string;
  newData: GeoJSONSource['data'];
  durationMs: number;
  easing: NonNullable<LayerTransition['easing']>;
  spec: VisualizationSpec;
}

/**
 * Resolves which layers should crossfade on this sync. A layer is eligible when
 * it declares a `'crossfade'` transition, is a `point` layer backed by a
 * `geojson` source whose `data` reference changed since `previousSpec`, and is
 * already mounted on the map (so there is rendered old data to fade out).
 *
 * `syncSourcesAndLayers` calls this *before* `upsertSources` so it can defer the
 * new data's `setData` for these sources — the crossfade commits it on
 * completion. The set of returned `sourceId`s is exactly what must be deferred.
 *
 * @param map - Live MapLibre map instance.
 * @param spec - The current visualization spec.
 * @param previousSpec - The spec from the prior sync.
 * @returns One {@link CrossfadePlan} per eligible layer.
 */
const planCrossfadeForLayer = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec,
  layer: VisualizationLayer
): CrossfadePlan | null => {
  if (layer.transition?.kind !== 'crossfade') return null;
  if (layer.geometry !== 'point') return null;
  const nextData = findGeojsonData(spec, layer.sourceId);
  if (nextData === undefined) return null;
  const prevData = findGeojsonData(previousSpec, layer.sourceId);
  if (prevData === undefined || prevData === nextData) return null;
  if (!map.getLayer(layer.id)) return null;
  return {
    layer,
    sourceId: layer.sourceId,
    newData: nextData,
    durationMs: layer.transition.durationMs ?? DEFAULT_DURATION_MS,
    easing: layer.transition.easing ?? DEFAULT_EASING,
    spec,
  };
};

export const planCrossfades = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec
): CrossfadePlan[] => {
  const plans: CrossfadePlan[] = [];
  for (const layer of spec.layers) {
    const plan = planCrossfadeForLayer(map, spec, previousSpec, layer);
    if (plan) plans.push(plan);
  }
  return plans;
};

/**
 * Entry point invoked after every layer sync: starts a crossfade for each
 * eligible layer (see {@link planCrossfades}). No-op when `previousSpec` is
 * `null`, when no transition is declared, or when the data reference is
 * unchanged.
 *
 * @param map - Live MapLibre map instance.
 * @param spec - The current visualization spec.
 * @param previousSpec - The spec from the prior sync, or `null` on first mount.
 * @param scheduler - Frame scheduler; defaults to rAF/`performance.now`.
 * @returns Nothing; mutates the map for each eligible layer.
 *
 * @example
 * ```ts
 * runCrossfades(map, nextSpec, prevSpec);
 * ```
 */
export const runCrossfades = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec | null,
  scheduler: CrossfadeScheduler = defaultScheduler
): void => {
  if (!previousSpec) return;

  for (const plan of planCrossfades(map, spec, previousSpec)) {
    startCrossfade(map, plan, scheduler);
  }
};
