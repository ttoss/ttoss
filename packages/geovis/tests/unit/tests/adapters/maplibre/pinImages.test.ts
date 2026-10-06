import { buildIcon, loadIcon } from '@ttoss/react-icons';
import type maplibregl from 'maplibre-gl';
import { buildPinSvg, syncImages } from 'src/adapters/maplibre/pinImages';
import type { PinImage, VisualizationSpec } from 'src/spec/types';

jest.mock('@ttoss/react-icons', () => {
  return {
    loadIcon: jest.fn(),
    buildIcon: jest.fn(),
  };
});

const HOSPITAL: PinImage = {
  id: 'hospital-pin',
  kind: 'pin',
  icon: 'maki:hospital',
  color: '#C0392B',
};

/**
 * Stands in for the browser's `Image`: "decodes" on the next microtask, or
 * fails when the SVG carries the marker `FAIL`.
 */
class FakeImage {
  width: number;
  height: number;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  set src(value: string) {
    queueMicrotask(() => {
      if (decodeURIComponent(value).includes('FAIL')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    });
  }
}

/** A map that keeps its registered images in a `Map`, like MapLibre's. */
const createMap = () => {
  const images = new Map<string, unknown>();
  const map = {
    hasImage: jest.fn((id: string) => {
      return images.has(id);
    }),
    addImage: jest.fn((id: string, image: unknown) => {
      if (images.has(id)) throw new Error(`image ${id} already exists`);
      images.set(id, image);
    }),
    removeImage: jest.fn((id: string) => {
      images.delete(id);
    }),
  };
  return { map: map as unknown as maplibregl.Map, mock: map, images };
};

const specWith = (images: PinImage[] | undefined): VisualizationSpec => {
  return { engine: 'maplibre', sources: [], layers: [], images };
};

/** Lets the pending icon lookup and SVG decode settle. */
const settle = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

beforeAll(() => {
  (globalThis as { Image?: unknown }).Image = FakeImage;
});

afterAll(() => {
  delete (globalThis as { Image?: unknown }).Image;
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadIcon).mockResolvedValue({
    body: '<path d="M0 0h15v15H0z" fill="currentColor"/>',
    width: 15,
    height: 15,
    left: 0,
    top: 0,
    rotate: 0,
    vFlip: false,
    hFlip: false,
  });
  jest.mocked(buildIcon).mockReturnValue({
    attributes: { width: '15', height: '15', viewBox: '0 0 15 15' },
    body: '<path d="M0 0h15v15H0z" fill="currentColor"/>',
  });
});

describe('buildPinSvg', () => {
  const icon = { viewBox: '0 0 15 15', body: '<path d="M1 1"/>' };

  test('draws the teardrop in the pin colour with the icon inside, white by default', () => {
    const { svg } = buildPinSvg({ pin: HOSPITAL, icon, pixelRatio: 1 });

    expect(svg).toContain('fill="#C0392B"');
    expect(svg).toContain('viewBox="0 0 15 15" color="#ffffff"');
    expect(svg).toContain('<path d="M1 1"/>');
  });

  test('sizes the image in device pixels, keeping the teardrop proportions', () => {
    expect(buildPinSvg({ pin: HOSPITAL, icon, pixelRatio: 2 })).toMatchObject({
      width: 56,
      height: 70,
    });
    expect(
      buildPinSvg({ pin: { ...HOSPITAL, size: 40 }, icon, pixelRatio: 1 })
    ).toMatchObject({ width: 40, height: 50 });
  });

  test('takes an icon colour and escapes attribute values', () => {
    const { svg } = buildPinSvg({
      pin: { ...HOSPITAL, color: 'red" onload="x', iconColor: '#111' },
      icon,
      pixelRatio: 1,
    });

    expect(svg).toContain('fill="red&quot; onload=&quot;x"');
    expect(svg).toContain('color="#111"');
  });
});

describe('syncImages', () => {
  test('registers a placeholder at once, then swaps the built pin in', async () => {
    const { map, mock, images } = createMap();

    syncImages(map, specWith([HOSPITAL]), null);

    expect(mock.addImage).toHaveBeenCalledTimes(1);
    expect(images.get('hospital-pin')).toMatchObject({ width: 1, height: 1 });
    expect(loadIcon).toHaveBeenCalledWith('maki:hospital');

    await settle();

    expect(images.get('hospital-pin')).toBeInstanceOf(FakeImage);
    expect(mock.addImage).toHaveBeenLastCalledWith(
      'hospital-pin',
      expect.any(FakeImage),
      { pixelRatio: 1 }
    );
  });

  test('does not rebuild an unchanged pin on the next sync', async () => {
    const { map } = createMap();
    const spec = specWith([HOSPITAL]);

    syncImages(map, spec, null);
    await settle();
    syncImages(map, spec, spec);
    await settle();

    expect(loadIcon).toHaveBeenCalledTimes(1);
  });

  test('rebuilds a pin whose descriptor changed', async () => {
    const { map } = createMap();
    const before = specWith([HOSPITAL]);
    const after = specWith([{ ...HOSPITAL, color: '#2E86C1' }]);

    syncImages(map, before, null);
    await settle();
    syncImages(map, after, before);
    await settle();

    expect(loadIcon).toHaveBeenCalledTimes(2);
  });

  test('rebuilds a pin the map lost, as after a basemap change', async () => {
    const { map, images } = createMap();
    const spec = specWith([HOSPITAL]);

    syncImages(map, spec, null);
    await settle();
    images.clear();
    syncImages(map, spec, null);
    await settle();

    expect(loadIcon).toHaveBeenCalledTimes(2);
    expect(images.get('hospital-pin')).toBeInstanceOf(FakeImage);
  });

  test('removes the images the spec no longer declares', async () => {
    const { map, images } = createMap();
    const before = specWith([HOSPITAL]);

    syncImages(map, before, null);
    await settle();
    syncImages(map, specWith(undefined), before);

    expect(images.has('hospital-pin')).toBe(false);
  });

  test('drops a build superseded before it finished', async () => {
    const { map, images } = createMap();
    const before = specWith([HOSPITAL]);

    syncImages(map, before, null);
    // Removed while its icon was still loading.
    syncImages(map, specWith([]), before);
    await settle();

    expect(images.has('hospital-pin')).toBe(false);
  });

  test('logs a pin that cannot be built and leaves the placeholder', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { map, images } = createMap();
    jest.mocked(buildIcon).mockReturnValue({
      attributes: { width: '15', height: '15', viewBox: '0 0 15 15' },
      body: '<path d="FAIL"/>',
    });

    syncImages(map, specWith([HOSPITAL]), null);
    await settle();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"hospital-pin" (maki:hospital)'),
      expect.any(Error)
    );
    expect(images.get('hospital-pin')).toMatchObject({ width: 1, height: 1 });
    warnSpy.mockRestore();
  });
});
