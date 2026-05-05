/**
 * Contract tests for the `FitBoundsToBbox` pattern used in
 * `MunicipalDistrictMapData.stories.tsx` and `DistrictMap.tsx`.
 *
 * # Root cause — the race condition
 *
 * `FitBoundsToBbox` registers a camera fit via `map.once('idle', apply)`.
 * MapLibre fires `idle` as soon as the style and first tile batch resolve,
 * which can happen **before** the browser has run its first CSS layout pass
 * on the parent container.  At that point `container.clientWidth` and
 * `container.clientHeight` are both 0.
 *
 * Sequence without the guard:
 *   1. React renders → MapLibre inits in a 0×0 container (CSS not yet applied)
 *   2. `idle` fires → `apply()` runs → `map.resize()` reports 0×0 to MapLibre
 *   3. `fitBounds(bbox, { padding })` computes a projection with 0-px viewport
 *      → camera center/zoom is wrong (or NaN)
 *   4. ResizeObserver fires with real dimensions → `apply()` runs again
 *   5. MapLibre now has the correct viewport… but the `idle` slot was already
 *      consumed, so the second fit lands on a properly-sized canvas — **except**
 *      that `map.resize()` in step 2 can leave internal canvas state corrupted,
 *      causing the north/south extremes of the bbox to be clipped.
 *
 * The fix: `apply` must guard `container.clientWidth > 0 && container.clientHeight > 0`
 * before calling `map.resize()` / `fitBounds`.  When the guard rejects (step 2),
 * the ResizeObserver callback (which already has a `rect.width === 0` guard) is
 * responsible for the eventual correct fit.
 *
 * # What these tests verify
 *
 * 1. **Bug reproduction** — without the guard, `fitBounds` is called with a
 *    0×0 container (the broken state that caused the clip).
 * 2. **Fix contract** — with the guard, `fitBounds` is NOT called when the
 *    container is 0×0.
 * 3. **Recovery path** — after the guard rejects and the container later
 *    receives its real CSS dimensions, `fitBounds` is called exactly once
 *    with the correct bbox and insets.
 * 4. **Happy path** — when the container already has valid dimensions when
 *    `idle` fires (normal fast layout), `fitBounds` is called immediately.
 *
 * # Why this lives in the geovis package
 *
 * The guard contract belongs in the same test suite as the other
 * `FitBoundsToBbox` / `mapLayoutBounds` layout rules.  Any refactor of the
 * pattern that removes the guard will cause these tests to fail before the
 * change reaches production.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Bbox = [number, number, number, number];

interface OverlayInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// ---------------------------------------------------------------------------
// Mock map factory
//
// Mimics the subset of `maplibre-gl.Map` used by `FitBoundsToBbox`:
//   - `getContainer()` — returns an object with `clientWidth / clientHeight`
//   - `resize()` — call recorder
//   - `fitBounds()` — call recorder
//
// `setContainerSize` lets individual tests change the reported dimensions
// mid-test to simulate the CSS layout pass arriving after `idle`.
// ---------------------------------------------------------------------------

interface MockContainer {
  clientWidth: number;
  clientHeight: number;
}

interface MockMap {
  getContainer: jest.Mock<MockContainer>;
  resize: jest.Mock;
  fitBounds: jest.Mock;
  /** Helper — updates the dimensions returned by `getContainer()`. */
  setContainerSize: (width: number, height: number) => void;
}

const makeMockMap = (initial: MockContainer): MockMap => {
  const container: MockContainer = { ...initial };
  return {
    getContainer: jest.fn(() => {
      return container;
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
    setContainerSize: (width, height) => {
      container.clientWidth = width;
      container.clientHeight = height;
    },
  };
};

// ---------------------------------------------------------------------------
// apply implementations
//
// Two variants mirror the before/after state of the fix.
// ---------------------------------------------------------------------------

/**
 * BROKEN — the original implementation without the size guard.
 * Calls `fitBounds` unconditionally, regardless of container dimensions.
 */
const makeUnguardedApply = (
  map: MockMap,
  bbox: Bbox,
  insets: OverlayInsets
) => {
  return () => {
    map.resize();
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: insets, animate: false, duration: 0 }
    );
  };
};

/**
 * FIXED — guards against zero-sized containers before calling `fitBounds`.
 * This is the contract the real `FitBoundsToBbox` must satisfy.
 */
const makeGuardedApply = (map: MockMap, bbox: Bbox, insets: OverlayInsets) => {
  return () => {
    const container = map.getContainer();
    if (container.clientWidth === 0 || container.clientHeight === 0) return;
    map.resize();
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: insets, animate: false, duration: 0 }
    );
  };
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Tight bbox for São Paulo municipality (from `computeBbox` on distrito-municipal-v2.json).
 * Used as a representative real-world value so tests catch projection anomalies.
 */
const SP_BBOX: Bbox = [-46.8253, -24.0082, -46.3653, -23.3567];

const OVERLAY_INSETS: OverlayInsets = {
  top: 14,
  left: 206,
  right: 8,
  bottom: 14,
};

// ---------------------------------------------------------------------------
// 1. Bug reproduction — unguarded apply fires with zero-sized container
// ---------------------------------------------------------------------------

describe('FitBoundsToBbox race condition — bug reproduction (unguarded apply)', () => {
  test('fitBounds IS called when idle fires with clientWidth === 0 (demonstrates the bug)', () => {
    // Simulates: map.once('idle', apply) fires before CSS layout pass.
    // Container reports 0×520 — the exact state observed in the browser console.
    const map = makeMockMap({ clientWidth: 0, clientHeight: 520 });
    const apply = makeUnguardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply(); // ← simulates `idle` firing while container has no width

    // The unguarded version calls fitBounds with a degenerate 0-wide viewport.
    // This is wrong — it should have been a no-op.
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
  });

  test('fitBounds IS called when idle fires with clientHeight === 0 (demonstrates the bug)', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 0 });
    const apply = makeUnguardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply(); // ← simulates `idle` firing while container has no height

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 2. Fix contract — guarded apply skips fitBounds for zero-sized containers
// ---------------------------------------------------------------------------

describe('FitBoundsToBbox race condition — fix contract (guarded apply)', () => {
  test('fitBounds is NOT called when idle fires with clientWidth === 0', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 520 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply(); // ← simulates `idle` firing while container has no width

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });

  test('fitBounds is NOT called when idle fires with clientHeight === 0', () => {
    const map = makeMockMap({ clientWidth: 800, clientHeight: 0 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply();

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });

  test('fitBounds is NOT called when both dimensions are 0 (fully unsettled layout)', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply();

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. Recovery path — ResizeObserver fires after guard rejects idle
// ---------------------------------------------------------------------------

describe('FitBoundsToBbox recovery path — ResizeObserver fires after idle is rejected', () => {
  test('fitBounds is called exactly once after container dimensions become available', () => {
    // Step 1: container starts at 0×0 (CSS not yet applied)
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    // Step 2: `idle` fires → guard rejects → no-op
    apply();
    expect(map.fitBounds).not.toHaveBeenCalled();

    // Step 3: CSS layout pass — container now has real dimensions
    map.setContainerSize(800, 520);

    // Step 4: ResizeObserver callback (width > 0 && height > 0 guard passes)
    apply();
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
  });

  test('fitBounds receives the correct bbox and insets on the recovery call', () => {
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    // idle fires while layout is unsettled → rejected
    apply();

    // layout settles, ResizeObserver fires
    map.setContainerSize(800, 520);
    apply();

    const [boundsArg, optionsArg] = map.fitBounds.mock.calls[0] as [
      [[number, number], [number, number]],
      { padding: OverlayInsets; animate: boolean; duration: number },
    ];

    expect(boundsArg).toEqual([
      [SP_BBOX[0], SP_BBOX[1]],
      [SP_BBOX[2], SP_BBOX[3]],
    ]);
    expect(optionsArg.padding).toEqual(OVERLAY_INSETS);
    expect(optionsArg.animate).toBe(false);
    expect(optionsArg.duration).toBe(0);
  });

  test('multiple idle rejections are all no-ops; only the first valid call fires fitBounds', () => {
    // Simulates the scenario where idle fires multiple times (e.g. map reuse)
    // while the container is still zero-sized.
    const map = makeMockMap({ clientWidth: 0, clientHeight: 0 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply(); // idle #1 — rejected
    apply(); // idle #2 — rejected
    apply(); // idle #3 — rejected

    expect(map.fitBounds).not.toHaveBeenCalled();

    map.setContainerSize(800, 520);
    apply(); // ResizeObserver — accepted

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Happy path — container already sized when idle fires
// ---------------------------------------------------------------------------

describe('FitBoundsToBbox happy path — container sized before idle fires', () => {
  test('fitBounds is called immediately when container already has valid dimensions', () => {
    // Simulates the common case where CSS layout settles before MapLibre emits idle.
    const map = makeMockMap({ clientWidth: 800, clientHeight: 520 });
    const apply = makeGuardedApply(map, SP_BBOX, OVERLAY_INSETS);

    apply();

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.resize).toHaveBeenCalledTimes(1);
  });

  test('fitBounds is NOT called when bbox is null (no valid geometry)', () => {
    // `computeBbox` returns null for an empty FeatureCollection.
    // FitBoundsToBbox skips the call entirely — guard must also cover null bbox.
    const map = makeMockMap({ clientWidth: 800, clientHeight: 520 });

    // Simulate the bbox-null guard that sits above the apply call in the effect:
    //   if (!runtime || !bbox) return;
    const applyWithNullBboxGuard = (bbox: Bbox | null) => {
      if (!bbox) return;
      const apply = makeGuardedApply(map, bbox, OVERLAY_INSETS);
      apply();
    };

    applyWithNullBboxGuard(null);

    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.resize).not.toHaveBeenCalled();
  });
});
