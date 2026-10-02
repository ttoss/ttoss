/**
 * The export's pure pieces: file naming, the map capture, the image
 * composition, encoding and download, and the overlay capture.
 */

import { toCanvas } from 'html-to-image';
import { captureMapCanvas, isCapturableMap } from 'src/export/captureMapCanvas';
import {
  captureOverlay,
  findLayerControl,
  findLegendCards,
  OVERLAY_BLEED,
  WORKSPACE_ROOT_ATTRIBUTE,
} from 'src/export/captureOverlay';
import {
  canvasToPngBlob,
  composeMapImage,
  downloadBlob,
} from 'src/export/composeMapImage';
import {
  sanitizeFileName,
  slugify,
  suggestFileName,
} from 'src/export/exportFileName';

jest.mock('html-to-image', () => {
  return { toCanvas: jest.fn() };
});

/** A 2D context recording what is drawn: the frame and overlays are images. */
const createContext = () => {
  return { drawImage: jest.fn() };
};

let contexts: ReturnType<typeof createContext>[] = [];

beforeEach(() => {
  contexts = [];
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => {
      const context = createContext();
      contexts.push(context);
      return context as unknown as CanvasRenderingContext2D;
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const createCanvas = ({ width, height }: { width: number; height: number }) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

describe('file naming', () => {
  test('slugify folds accents, case and punctuation into hyphens', () => {
    expect(slugify('Taxa cumulativa (% do total)')).toBe(
      'taxa-cumulativa-do-total'
    );
    expect(slugify('  Ação  ')).toBe('acao');
  });

  test('suggestFileName appends the year when there is one', () => {
    expect(suggestFileName({ title: 'Cozinhas', year: 2024 })).toBe(
      'cozinhas_2024'
    );
    expect(suggestFileName({ title: 'Cozinhas' })).toBe('cozinhas');
  });

  test('suggestFileName falls back to "mapa" when the title folds to nothing', () => {
    expect(suggestFileName({ title: '%%' })).toBe('mapa');
    expect(suggestFileName({ year: 2020 })).toBe('mapa_2020');
  });

  test('sanitizeFileName drops the extension and forbidden characters', () => {
    expect(sanitizeFileName('mapa:final.PNG')).toBe('mapafinal');
    expect(sanitizeFileName('a/b\\c*?"<>|')).toBe('abc');
  });
});

describe('captureMapCanvas', () => {
  const createMap = () => {
    const source = createCanvas({ width: 200, height: 100 });
    let listener: (() => void) | undefined;

    return {
      source,
      map: {
        getCanvas: () => {
          return source;
        },
        once: jest.fn((_type: 'render', fn: () => void) => {
          listener = fn;
        }),
        triggerRepaint: jest.fn(() => {
          listener?.();
        }),
      },
    };
  };

  test('isCapturableMap accepts only an object with the three methods', () => {
    expect(isCapturableMap(createMap().map)).toBe(true);
    expect(isCapturableMap(null)).toBe(false);
    expect(isCapturableMap({ getCanvas: () => {} })).toBe(false);
  });

  test('copies the frame inside the render forced by a repaint', async () => {
    const { map, source } = createMap();

    const snapshot = await captureMapCanvas(map);

    expect(map.once).toHaveBeenCalledWith('render', expect.any(Function));
    expect(map.triggerRepaint).toHaveBeenCalled();
    expect(snapshot.width).toBe(200);
    expect(snapshot.height).toBe(100);
    expect(contexts[0].drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  test('rejects when no 2D context is available', async () => {
    jest.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    await expect(captureMapCanvas(createMap().map)).rejects.toThrow(
      '2D canvas context unavailable'
    );
  });
});

describe('composeMapImage', () => {
  const snapshot = createCanvas({ width: 800, height: 600 });

  test('draws only the frame when there are no overlays', () => {
    const canvas = composeMapImage({ snapshot, overlays: [] });
    const [context] = contexts;

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(context.drawImage).toHaveBeenCalledTimes(1);
    expect(context.drawImage).toHaveBeenCalledWith(snapshot, 0, 0);
  });

  test('draws the overlays over the frame in order, each at its offset', () => {
    const legend = createCanvas({ width: 276, height: 200 });
    const menu = createCanvas({ width: 300, height: 600 });

    composeMapImage({
      snapshot,
      overlays: [
        { canvas: legend, x: 500, y: 380 },
        { canvas: menu, x: 12, y: 0 },
      ],
    });

    expect(contexts[0].drawImage.mock.calls).toEqual([
      [snapshot, 0, 0],
      [legend, 500, 380],
      [menu, 12, 0],
    ]);
  });

  test('throws when no 2D context is available', () => {
    jest.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    expect(() => {
      return composeMapImage({ snapshot, overlays: [] });
    }).toThrow('2D canvas context unavailable');
  });
});

describe('encoding and download', () => {
  test('canvasToPngBlob resolves with the encoded PNG', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const canvas = createCanvas({ width: 1, height: 1 });
    canvas.toBlob = jest.fn((callback: BlobCallback) => {
      callback(blob);
    });

    await expect(canvasToPngBlob(canvas)).resolves.toBe(blob);
    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png'
    );
  });

  test('canvasToPngBlob rejects when the browser cannot encode', async () => {
    const canvas = createCanvas({ width: 1, height: 1 });
    canvas.toBlob = jest.fn((callback: BlobCallback) => {
      callback(null);
    });

    await expect(canvasToPngBlob(canvas)).rejects.toThrow(
      'PNG encoding failed'
    );
  });

  test('downloadBlob clicks a link to the blob, then revokes it', () => {
    jest.useFakeTimers();
    const createObjectURL = jest.fn(() => {
      return 'blob:mapa';
    });
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('mapa_2024.png');
        expect(this.href).toBe('blob:mapa');
      });

    downloadBlob({ blob: new Blob(['png']), fileName: 'mapa_2024.png' });

    expect(click).toHaveBeenCalled();
    expect(document.querySelector('a')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mapa');
    jest.useRealTimers();
  });
});

describe('captureOverlay', () => {
  test('renders the node and places it relative to the map canvas', async () => {
    const rendered = createCanvas({ width: 600, height: 1200 });
    jest.mocked(toCanvas).mockResolvedValue(rendered);

    const node = document.createElement('div');
    const mapCanvas = document.createElement('canvas');
    jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 30,
      top: 20,
      width: 276,
      height: 180,
    } as DOMRect);
    jest.spyOn(mapCanvas, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 10,
    } as DOMRect);

    const layer = await captureOverlay({ node, mapCanvas, pixelRatio: 2 });

    // The image is the box grown by the bleed on every side, the clone pinned
    // that far in at its measured size: a badge or shadow past the box is kept,
    // and the node's own `right`/`bottom` anchoring cannot push it out.
    expect(toCanvas).toHaveBeenCalledWith(node, {
      pixelRatio: 2,
      width: 276 + OVERLAY_BLEED * 2,
      height: 180 + OVERLAY_BLEED * 2,
      style: expect.objectContaining({
        position: 'absolute',
        top: `${OVERLAY_BLEED}px`,
        left: `${OVERLAY_BLEED}px`,
        right: 'auto',
        bottom: 'auto',
        width: '276px',
        height: '180px',
      }),
    });
    // Placed back by the bleed, so the node itself lands where it sat.
    expect(layer).toEqual({
      canvas: rendered,
      x: (20 - OVERLAY_BLEED) * 2,
      y: (10 - OVERLAY_BLEED) * 2,
    });
  });
});

describe('findLegendCards', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('finds the legend cards in the workspace around the node', () => {
    document.body.innerHTML = `
      <div ${WORKSPACE_ROOT_ATTRIBUTE}>
        <div data-geovis-legend="rate"></div>
        <div data-geovis-legend="age"></div>
        <div id="dialog"></div>
      </div>
      <div ${WORKSPACE_ROOT_ATTRIBUTE}>
        <div data-geovis-legend="other"></div>
      </div>
    `;

    const cards = findLegendCards(document.getElementById('dialog')!);

    expect(
      cards.map((card) => {
        return card.dataset.geovisLegend;
      })
    ).toEqual(['rate', 'age']);
  });

  test('finds nothing outside a workspace', () => {
    document.body.innerHTML = `
      <div data-geovis-legend="rate"></div>
      <div id="dialog"></div>
    `;

    expect(findLegendCards(document.getElementById('dialog')!)).toEqual([]);
    expect(findLegendCards(null)).toEqual([]);
  });
});

describe('findLayerControl', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('finds the layer control in the workspace around the node', () => {
    document.body.innerHTML = `
      <div ${WORKSPACE_ROOT_ATTRIBUTE}>
        <div id="control" data-geovis-layer-control></div>
        <div id="dialog"></div>
      </div>
    `;

    expect(findLayerControl(document.getElementById('dialog')!)).toBe(
      document.getElementById('control')
    );
  });

  test('finds nothing without a control, or outside a workspace', () => {
    document.body.innerHTML = `
      <div ${WORKSPACE_ROOT_ATTRIBUTE}><div id="inside"></div></div>
      <div data-geovis-layer-control></div>
      <div id="outside"></div>
    `;

    expect(findLayerControl(document.getElementById('inside')!)).toBeNull();
    expect(findLayerControl(document.getElementById('outside')!)).toBeNull();
    expect(findLayerControl(null)).toBeNull();
  });
});
