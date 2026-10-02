/**
 * A piece of the page captured over the map — the menu, a legend card — and
 * where it sat — in the frame's device pixels, relative to the map canvas's
 * top-left corner.
 */
export interface ExportOverlay {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
}

/**
 * Lays the export's overlays over a captured map frame, in order, each where it
 * sat on screen — so the menu, passed last, lands on top. Leaving one out is how
 * the dialog's toggles switch it off — the map frame itself never changes.
 *
 * @param params.snapshot - The captured map frame (see `captureMapCanvas`).
 * @param params.overlays - The captured overlays, bottom to top.
 * @returns A new canvas at the frame's resolution.
 *
 * @example
 * composeMapImage({ snapshot, overlays: [...legends, menu] });
 */
export const composeMapImage = ({
  snapshot,
  overlays,
}: {
  snapshot: HTMLCanvasElement;
  overlays: ExportOverlay[];
}): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D canvas context unavailable');
  }

  context.drawImage(snapshot, 0, 0);

  for (const overlay of overlays) {
    context.drawImage(overlay.canvas, overlay.x, overlay.y);
  }

  return canvas;
};

/**
 * Encodes a canvas as a PNG blob.
 *
 * @param canvas - The composed image.
 * @returns The PNG; rejects when the browser cannot encode it — a canvas
 * tainted by cross-origin tiles served without CORS, typically.
 *
 * @example
 * const blob = await canvasToPngBlob(canvas);
 */
export const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
};

/**
 * Hands a blob to the browser as a download.
 *
 * @param params.blob - The file contents.
 * @param params.fileName - The name to save it under, extension included.
 *
 * @example
 * downloadBlob({ blob, fileName: 'mapa_2024.png' });
 */
export const downloadBlob = ({
  blob,
  fileName,
}: {
  blob: Blob;
  fileName: string;
}) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoked on the next tick rather than at once: some browsers start the
  // download asynchronously and would find the URL already gone.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};
