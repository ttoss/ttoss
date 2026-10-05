/**
 * The slice of a MapLibre map the capture needs. Typed structurally so the
 * workspace keeps no dependency on `maplibre-gl` — the instance comes from
 * `runtime.getAdapter().getNativeInstance()`, which is `unknown` by contract.
 */
export interface CapturableMap {
  getCanvas: () => HTMLCanvasElement;
  once: (type: 'render', listener: () => void) => unknown;
  triggerRepaint: () => void;
}

/**
 * Whether a native map instance can be captured.
 *
 * @param map - Whatever `getNativeInstance()` returned.
 * @returns `true` when it exposes the three methods the capture calls.
 *
 * @example
 * isCapturableMap(runtime.getAdapter().getNativeInstance()); // true
 */
export const isCapturableMap = (map: unknown): map is CapturableMap => {
  const candidate = map as Partial<CapturableMap> | null;

  return (
    typeof candidate?.getCanvas === 'function' &&
    typeof candidate.once === 'function' &&
    typeof candidate.triggerRepaint === 'function'
  );
};

/**
 * Copies the map's current frame into a 2D canvas of the same pixel size.
 *
 * MapLibre creates its WebGL context without `preserveDrawingBuffer`, so the
 * canvas holds a frame only until the browser composites it — read it later
 * and it comes back blank. The copy is therefore taken inside a `render`
 * listener, right after a repaint is forced: the one moment the frame is
 * guaranteed to still be there. This keeps the engine's settings untouched
 * rather than paying for a preserved buffer on every frame.
 *
 * @param map - The native map instance.
 * @returns A 2D canvas holding the frame, at the map canvas's own resolution.
 *
 * @example
 * const snapshot = await captureMapCanvas(map);
 */
export const captureMapCanvas = (
  map: CapturableMap
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    map.once('render', () => {
      const source = map.getCanvas();
      const snapshot = document.createElement('canvas');
      snapshot.width = source.width;
      snapshot.height = source.height;

      const context = snapshot.getContext('2d');

      if (!context) {
        reject(new Error('2D canvas context unavailable'));
        return;
      }

      context.drawImage(source, 0, 0);
      resolve(snapshot);
    });

    map.triggerRepaint();
  });
};
