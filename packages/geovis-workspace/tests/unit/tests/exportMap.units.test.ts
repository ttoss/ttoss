/**
 * The export's pure pieces: file naming, the map capture, the image
 * composition, encoding and download, and the menu capture.
 */

import { toCanvas } from 'html-to-image';
import { captureMapCanvas, isCapturableMap } from 'src/export/captureMapCanvas';
import { captureMenu } from 'src/export/captureMenu';
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

/** A 2D context recording what is drawn, enough for every drawing call used. */
const createContext = () => {
  return {
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn((text: string) => {
      return { width: text.length * 6 };
    }),
    beginPath: jest.fn(),
    roundRect: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    fillStyle: '',
    font: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
  };
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

  test('draws only the frame when nothing is asked for', () => {
    const canvas = composeMapImage({ snapshot, pixelRatio: 1 });
    const [context] = contexts;

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(context.drawImage).toHaveBeenCalledTimes(1);
    expect(context.drawImage).toHaveBeenCalledWith(snapshot, 0, 0);
    expect(context.fillText).not.toHaveBeenCalled();
  });

  test('draws the legend card bottom-right, heading first', () => {
    composeMapImage({
      snapshot,
      pixelRatio: 2,
      legend: {
        title: 'Taxa',
        rows: [
          { color: '#eee', label: '< 5' },
          { color: '#333', label: '5 – 10' },
        ],
      },
    });
    const [context] = contexts;

    expect(context.roundRect).toHaveBeenCalledTimes(1);
    expect(
      context.fillText.mock.calls.map((call) => {
        return call[0];
      })
    ).toEqual(['Taxa', '< 5', '5 – 10']);
    expect(context.fillRect).toHaveBeenCalledTimes(2);

    // The card hugs the bottom-right corner, 16px (× 2) in from both edges.
    const [x, y, width, height] = context.roundRect.mock.calls[0];
    expect(x + width).toBe(800 - 32);
    expect(y + height).toBe(600 - 32);
  });

  test('draws a legend without a heading', () => {
    composeMapImage({
      snapshot,
      pixelRatio: 1,
      legend: { rows: [{ color: '#eee', label: 'Todos' }] },
    });

    expect(
      contexts[0].fillText.mock.calls.map((call) => {
        return call[0];
      })
    ).toEqual(['Todos']);
  });

  test('draws no card for a legend without rows', () => {
    composeMapImage({
      snapshot,
      pixelRatio: 1,
      legend: { title: 'Vazia', rows: [] },
    });

    expect(contexts[0].roundRect).not.toHaveBeenCalled();
    expect(contexts[0].fillText).not.toHaveBeenCalled();
  });

  test('draws the menu last, at its offset', () => {
    const menu = createCanvas({ width: 300, height: 600 });

    composeMapImage({
      snapshot,
      pixelRatio: 1,
      legend: { rows: [{ color: '#eee', label: 'Todos' }] },
      menu: { canvas: menu, x: 12, y: 0 },
    });
    const { drawImage, fillText } = contexts[0];

    expect(drawImage).toHaveBeenLastCalledWith(menu, 12, 0);
    expect(drawImage.mock.invocationCallOrder[1]).toBeGreaterThan(
      fillText.mock.invocationCallOrder[0]
    );
  });

  test('throws when no 2D context is available', () => {
    jest.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    expect(() => {
      return composeMapImage({ snapshot, pixelRatio: 1 });
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

describe('captureMenu', () => {
  test('renders the node and places it relative to the map canvas', async () => {
    const rendered = createCanvas({ width: 600, height: 1200 });
    jest.mocked(toCanvas).mockResolvedValue(rendered);

    const node = document.createElement('div');
    const mapCanvas = document.createElement('canvas');
    jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 30,
      top: 20,
    } as DOMRect);
    jest.spyOn(mapCanvas, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 10,
    } as DOMRect);

    const layer = await captureMenu({ node, mapCanvas, pixelRatio: 2 });

    expect(toCanvas).toHaveBeenCalledWith(node, { pixelRatio: 2 });
    expect(layer).toEqual({ canvas: rendered, x: 40, y: 20 });
  });
});
