import type maplibregl from 'maplibre-gl';

/** Default duration of an extruded layer's rise and fall, in milliseconds. */
export const DEFAULT_EXTRUSION_TRANSITION_MS = 600;

/** A `fill-extrusion-height` value: a literal or a MapLibre expression. */
export type ExtrusionHeight = unknown[] | number;

/**
 * Frame scheduler, injectable so the animation is deterministically testable —
 * the same seam the crossfade uses.
 */
export interface ExtrusionScheduler {
  /** Current timestamp in milliseconds. */
  now: () => number;
  /** Schedules `cb` for the next frame; returns a cancellation handle. */
  raf: (cb: () => void) => number;
  /** Cancels a previously scheduled frame by its handle. */
  caf: (handle: number) => void;
}

const defaultScheduler: ExtrusionScheduler = {
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

let scheduler = defaultScheduler;

/** Replaces the frame scheduler; `undefined` restores the default. For tests. */
export const setExtrusionScheduler = (next?: ExtrusionScheduler): void => {
  scheduler = next ?? defaultScheduler;
};

interface Animation {
  from: ExtrusionHeight;
  to: ExtrusionHeight;
  start: number;
  durationMs: number;
  frame: number;
}

interface Entry {
  /** The height the layer rests at, or is heading to while animating. */
  target: ExtrusionHeight;
  animation?: Animation;
}

const store = new WeakMap<maplibregl.Map, Map<string, Entry>>();

const entriesFor = (map: maplibregl.Map): Map<string, Entry> => {
  const existing = store.get(map);
  if (existing) return existing;
  const created = new Map<string, Entry>();
  store.set(map, created);
  return created;
};

const easeInOut = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

/**
 * The height `t` of the way from `from` to `to`, as one expression.
 *
 * MapLibre does not transition data-driven paint properties — a new height
 * expression lands at once — so the animation writes this blend once per
 * frame. Each feature keeps its own height on both ends, which is what lets a
 * class-mode layer rise from flat, or move from one `maxHeight` to the next,
 * without the prisms passing through each other's heights.
 */
const blend = ({
  from,
  to,
  t,
}: {
  from: ExtrusionHeight;
  to: ExtrusionHeight;
  t: number;
}): ExtrusionHeight => {
  if (t >= 1) return to;
  if (t <= 0) return from;
  return ['+', ['*', 1 - t, from], ['*', t, to]];
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

const sameHeight = (a: ExtrusionHeight, b: ExtrusionHeight): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

/** Where an animation has got to, as a height a new one can start from. */
const currentHeight = (entry: Entry): ExtrusionHeight => {
  const { animation } = entry;
  if (!animation) return entry.target;
  const progress = Math.min(
    1,
    (scheduler.now() - animation.start) / animation.durationMs
  );
  return blend({
    from: animation.from,
    to: animation.to,
    t: easeInOut(progress),
  });
};

const writeHeight = (
  map: maplibregl.Map,
  layerId: string,
  height: ExtrusionHeight
): boolean => {
  if (!map.getLayer(layerId)) return false;
  map.setPaintProperty(
    layerId,
    'fill-extrusion-height',
    height as maplibregl.DataDrivenPropertyValueSpecification<number>
  );
  return true;
};

/**
 * Stops a layer's animation where it is, without running its `onComplete` —
 * the caller is replacing it, and a collapse it interrupts must not go on to
 * swap the layer out.
 */
const stopAnimation = (entry: Entry | undefined): void => {
  if (!entry?.animation) return;
  scheduler.caf(entry.animation.frame);
  entry.animation = undefined;
};

interface TransitionParams {
  map: maplibregl.Map;
  layerId: string;
  to: ExtrusionHeight;
  from?: ExtrusionHeight;
  durationMs: number;
  onComplete?: () => void;
}

/** Whether to land at once: no duration, reduced motion, or already there. */
const shouldSnap = ({
  start,
  to,
  durationMs,
}: {
  start: ExtrusionHeight;
  to: ExtrusionHeight;
  durationMs: number;
}): boolean => {
  return durationMs <= 0 || prefersReducedMotion() || sameHeight(start, to);
};

/** Runs the ease frame by frame, writing the blend until it reaches `to`. */
const animate = ({
  map,
  layerId,
  entry,
  from,
  to,
  durationMs,
  onComplete,
}: Omit<TransitionParams, 'from'> & {
  entry: Entry;
  from: ExtrusionHeight;
}): void => {
  const startedAt = scheduler.now();

  const step = () => {
    const progress = Math.min(1, (scheduler.now() - startedAt) / durationMs);
    const height = blend({ from, to, t: easeInOut(progress) });
    if (!writeHeight(map, layerId, height)) {
      entry.animation = undefined;
      return;
    }
    if (progress >= 1) {
      entry.animation = undefined;
      onComplete?.();
      return;
    }
    entry.animation!.frame = scheduler.raf(step);
  };

  entry.animation = { from, to, start: startedAt, durationMs, frame: 0 };
  step();
};

/**
 * Moves an extruded layer's `fill-extrusion-height` to `to`, eased over
 * `durationMs`.
 *
 * Starts from wherever the layer is — mid-flight included, so a reader
 * dragging a height slider through several stops sees one continuous motion —
 * unless `from` says otherwise (a layer just added at height `0`). Snaps when
 * the duration is `0`, when the viewer prefers reduced motion, or when the
 * layer is already there.
 *
 * @param params.map - The live map.
 * @param params.layerId - The `fill-extrusion` layer.
 * @param params.to - The height to end at.
 * @param params.from - The height to start from; defaults to the current one.
 * @param params.durationMs - The ease's duration.
 * @param params.onComplete - Runs once the layer rests at `to`; dropped if a
 * later call interrupts this one.
 *
 * @example
 * transitionExtrusionHeight({ map, layerId: 'districts', from: 0, to: height, durationMs: 600 });
 */
export const transitionExtrusionHeight = ({
  map,
  layerId,
  to,
  from,
  durationMs,
  onComplete,
}: TransitionParams): void => {
  const entries = entriesFor(map);
  const entry = entries.get(layerId);

  // Already resting at `to`, or on its way there: a repeat of the same request
  // (a legend re-apply after a sync, say) must not restart the ease.
  if (from === undefined && entry && sameHeight(entry.target, to)) {
    if (!entry.animation) onComplete?.();
    return;
  }

  const start = from ?? (entry ? currentHeight(entry) : to);
  stopAnimation(entry);

  if (shouldSnap({ start, to, durationMs })) {
    entries.set(layerId, { target: to });
    // MapLibre compares a written value with the current one and ignores an
    // unchanged write, so a snap to where the layer already rests costs nothing.
    writeHeight(map, layerId, to);
    onComplete?.();
    return;
  }

  const next: Entry = { target: to };
  entries.set(layerId, next);
  animate({
    map,
    layerId,
    entry: next,
    from: start,
    to,
    durationMs,
    onComplete,
  });
};

/** Whether a layer's height is mid-animation. */
export const isExtrusionAnimating = (
  map: maplibregl.Map,
  layerId: string
): boolean => {
  return entriesFor(map).get(layerId)?.animation !== undefined;
};

/**
 * Drops a layer's height state, cancelling any animation without running its
 * `onComplete`. Call it when the layer leaves the map, so a later layer with
 * the same id starts fresh.
 */
export const forgetExtrusionHeight = (
  map: maplibregl.Map,
  layerId: string
): void => {
  const entries = entriesFor(map);
  stopAnimation(entries.get(layerId));
  entries.delete(layerId);
};
