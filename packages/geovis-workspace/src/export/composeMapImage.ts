import { COLOR, FONT_HEAD, FONT_MONO } from '../components/LeftSidebar/theme';

/** One color row of the exported legend. */
export interface ExportLegendRow {
  color: string;
  label: string;
}

/** What the legend card carries. No rows, no card. */
export interface ExportLegendContent {
  title?: string;
  rows: ExportLegendRow[];
}

/**
 * Draws a white rounded card with the same soft shadow the on-screen legend
 * uses, so the overlays read as the map's own chrome in the exported image.
 */
const drawCard = ({
  context,
  x,
  y,
  width,
  height,
  unit,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  unit: number;
}) => {
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.12)';
  context.shadowBlur = 16 * unit;
  context.shadowOffsetY = 3 * unit;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.roundRect(x, y, width, height, 10 * unit);
  context.fill();
  context.restore();
};

const setFont = ({
  context,
  weight,
  size,
  family,
  unit,
}: {
  context: CanvasRenderingContext2D;
  weight: number;
  size: number;
  family: string;
  unit: number;
}) => {
  context.font = `${weight} ${size * unit}px ${family}`;
};

/** The legend card, bottom-right: an optional heading over one row per color. */
const drawLegendCard = ({
  context,
  content,
  unit,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  content: ExportLegendContent;
  unit: number;
  width: number;
  height: number;
}) => {
  if (content.rows.length === 0) return;

  const margin = 16 * unit;
  const padding = 14 * unit;
  const rowHeight = 20 * unit;
  const swatch = 12 * unit;
  const swatchGap = 8 * unit;
  const headingHeight = content.title ? 24 * unit : 0;

  setFont({ context, weight: 400, size: 12, family: FONT_MONO, unit });
  const rowsWidth = Math.max(
    ...content.rows.map((row) => {
      return context.measureText(row.label).width;
    })
  );
  setFont({ context, weight: 600, size: 13, family: FONT_HEAD, unit });
  const headingWidth = content.title
    ? context.measureText(content.title).width
    : 0;

  const cardWidth =
    Math.max(swatch + swatchGap + rowsWidth, headingWidth) + padding * 2;
  const cardHeight =
    padding * 2 + headingHeight + content.rows.length * rowHeight;
  const x = width - margin - cardWidth;
  const y = height - margin - cardHeight;

  drawCard({ context, x, y, width: cardWidth, height: cardHeight, unit });

  if (content.title) {
    context.fillStyle = COLOR.textStrong;
    context.fillText(
      content.title,
      x + padding,
      y + padding + headingHeight / 2
    );
  }

  setFont({ context, weight: 400, size: 12, family: FONT_MONO, unit });
  for (const [index, row] of content.rows.entries()) {
    const middle =
      y + padding + headingHeight + index * rowHeight + rowHeight / 2;

    context.fillStyle = row.color;
    context.fillRect(x + padding, middle - swatch / 2, swatch, swatch);

    context.fillStyle = COLOR.textMuted;
    context.fillText(row.label, x + padding + swatch + swatchGap, middle);
  }
};

/**
 * The menu as captured from the page, and where it sat over the map — in the
 * frame's device pixels, relative to the map canvas's top-left corner.
 */
export interface ExportMenuLayer {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
}

/**
 * Lays the export's overlays over a captured map frame: the legend card when
 * `legend` is given, then the menu when `menu` is given, on top, where it sat
 * on screen. Leaving either out is how the dialog's toggles switch them off —
 * the map frame itself never changes.
 *
 * Card sizes are in CSS pixels multiplied by `pixelRatio`, so the legend comes
 * out the size it would be on the screen the frame was captured from.
 *
 * @param params.snapshot - The captured map frame (see `captureMapCanvas`).
 * @param params.pixelRatio - Device pixels per CSS pixel of the frame.
 * @param params.legend - Legend heading and rows, or `undefined` to leave it out.
 * @param params.menu - The captured menu, or `undefined` to leave it out.
 * @returns A new canvas at the frame's resolution.
 *
 * @example
 * composeMapImage({ snapshot, pixelRatio: 2, legend: { rows }, menu });
 */
export const composeMapImage = ({
  snapshot,
  pixelRatio,
  legend,
  menu,
}: {
  snapshot: HTMLCanvasElement;
  pixelRatio: number;
  legend?: ExportLegendContent;
  menu?: ExportMenuLayer;
}): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D canvas context unavailable');
  }

  context.drawImage(snapshot, 0, 0);
  context.textBaseline = 'middle';

  if (legend) {
    drawLegendCard({
      context,
      content: legend,
      unit: pixelRatio,
      width: canvas.width,
      height: canvas.height,
    });
  }

  if (menu) {
    context.drawImage(menu.canvas, menu.x, menu.y);
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
