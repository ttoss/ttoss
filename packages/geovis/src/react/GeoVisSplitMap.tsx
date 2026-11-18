import * as React from 'react';

import type { CameraView } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { LayerControlItem, VisualizationSpec } from '../spec/types';
import { useGeoVis } from './contexts';
import { GeoVisCanvas } from './GeoVisCanvas';
import { GeoVisProvider } from './GeoVisProvider';
import { SplitHalves } from './GeoVisSplitMap.halves';
import { SidePicker, type SidePickerEntry } from './GeoVisSplitMap.picker';
import { pickerPlacement, useDismissPicker } from './GeoVisSplitMap.placement';
import {
  deriveSplitSideSpec,
  type GeoVisMapModeContextValue,
  type GeoVisSplitSide,
  useGeoVisMapMode,
} from './mapMode';
import { changedViewFields } from './mapMode.split';

const MUTED = '#6b7a90';

/** Below this width the two pickers stack on the divider instead of flanking it. */
const STACK_BELOW = 300;

const SIDES: GeoVisSplitSide[] = ['a', 'b'];

/** Keeps the cameras of the sides together. */
interface SideSync {
  runtimes: Map<GeoVisSplitSide, GeoVisRuntime>;
  /** Set while one side's camera is being copied onto the other. */
  mirroring: boolean;
}

/**
 * Registers a side's runtime and mirrors its camera onto the other side. The
 * copy is an instant `setView`, whose own `move` events fire synchronously
 * while `mirroring` is set and are dropped, so the two never echo each other.
 */
const SideCameraSync = ({
  side,
  sync,
  onCamera,
}: {
  side: GeoVisSplitSide;
  sync: React.RefObject<SideSync>;
  onCamera: (camera: CameraView) => void;
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    const state = sync.current;
    if (!runtime || !state) return;
    state.runtimes.set(side, runtime);
    const unsubscribe = runtime.onViewChange((camera) => {
      if (state.mirroring) return;
      onCamera(camera);
      const { center, zoom, pitch, bearing } = camera;
      state.mirroring = true;
      try {
        for (const [other, peer] of state.runtimes) {
          if (other === side) continue;
          peer.setView({ center, zoom, pitch, bearing, animate: false });
        }
      } finally {
        state.mirroring = false;
      }
    });
    return () => {
      unsubscribe();
      if (state.runtimes.get(side) === runtime) state.runtimes.delete(side);
    };
  }, [runtime, side, sync, onCamera]);

  return null;
};

const ColumnsIcon = () => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18" />
    </svg>
  );
};

/** The container's width, followed as it resizes. */
const useWidth = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setWidth(element.clientWidth);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
};

/** The vertical line between the sides, at `left`, with its handle. */
const Divider = ({ left }: { left: number | string }) => {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left,
          width: 2,
          marginLeft: -1,
          background: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left,
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.16)',
          color: MUTED,
        }}
      >
        <ColumnsIcon />
      </div>
    </div>
  );
};

/**
 * One side's spec, rebuilt only when its source or item changes, reading the
 * latest camera then — so an update never throws the camera back — and
 * letting through what the app changed in `spec.view` with the new source:
 * computed once per source, so a later pick of an item keeps the camera
 * where the reader moved it.
 */
const useSideSpec = ({
  source,
  item,
  primary,
  ownLegends,
  getCamera,
}: {
  source: VisualizationSpec;
  item: LayerControlItem | null;
  primary: boolean;
  ownLegends: boolean;
  getCamera: () => CameraView | null;
}) => {
  // An item by what it is, not by reference: the provider rebuilds its items
  // whenever it commits a spec, the same ones included.
  const itemKey = item ? `${item.id}:${item.layers.join(',')}` : null;
  // No changes on the first build: then the reader's camera wins outright.
  const [last, setLast] = React.useState({
    source,
    itemKey,
    viewChanges: {} as Partial<CameraView>,
  });
  let { viewChanges } = last;
  if (last.source !== source || last.itemKey !== itemKey) {
    viewChanges =
      last.source === source
        ? {}
        : changedViewFields(last.source.view, source.view);
    setLast({ source, itemKey, viewChanges });
  }
  return React.useMemo(() => {
    return deriveSplitSideSpec({
      spec: source,
      item,
      camera: getCamera(),
      primary,
      ownLegends,
      viewChanges,
    });
  }, [source, item, primary, ownLegends, getCamera, viewChanges]);
};

/** What a side's pill shows and lists: the `control` items. */
const pickerData = ({
  mode,
  side,
}: {
  mode: GeoVisMapModeContextValue;
  side: GeoVisSplitSide;
}) => {
  const { options, sides, setSide } = mode;
  const entries: SidePickerEntry[] = options.map((item) => {
    return { id: item.id, label: item.label, item };
  });
  return {
    current:
      entries.find((entry) => {
        return entry.id === sides[side];
      }) ?? null,
    // "No layer" first, so a side can be emptied again after a choice.
    entries: [{ id: null, label: '', item: null }, ...entries],
    selected: sides[side],
    onPick: (id: string | null) => {
      setSide(side, id);
    },
  };
};

/**
 * Where the divider sits: the middle of the map the app's panels leave free
 * (`spec.viewInsets`), not of the whole canvas.
 */
const dividerOf = ({
  spec,
  width,
}: {
  spec: VisualizationSpec;
  width: number;
}) => {
  const { left = 0, right = 0 } = spec.viewInsets ?? {};
  const free = Math.max(0, width - left - right);
  return { center: left + free / 2, free };
};

/** The two pills, flanking the divider or stacked over it. */
const SplitPickers = ({
  width,
  center,
  free,
}: {
  width: number;
  center: number;
  free: number;
}) => {
  const mode = useGeoVisMapMode();
  const measured = width > 0;
  const stacked = measured && free < STACK_BELOW;
  const [openPicker, setOpenPicker] = React.useState<GeoVisSplitSide | null>(
    null
  );
  const closePicker = React.useCallback(() => {
    setOpenPicker(null);
  }, []);
  useDismissPicker(openPicker, closePicker);
  const pillMax = Math.max(80, Math.floor(stacked ? free - 16 : free / 2 - 20));

  return (
    <>
      {SIDES.map((side) => {
        const placement = pickerPlacement({
          side,
          stacked,
          center: measured ? center : null,
          width,
        });
        return (
          <SidePicker
            key={side}
            side={side}
            open={openPicker === side}
            onToggle={() => {
              setOpenPicker((prev) => {
                return prev === side ? null : side;
              });
            }}
            maxWidth={pillMax}
            style={placement.style}
            menuAlign={placement.menuAlign}
            active={mode.split !== null && mode.activeSide === side}
            {...pickerData({ mode, side })}
          />
        );
      })}
    </>
  );
};

/** One side's map: a provider of its own over the side's spec. */
const SideMap = ({
  side,
  sideSpec,
  dividerAt,
  sync,
  onCamera,
}: {
  side: GeoVisSplitSide;
  sideSpec: VisualizationSpec;
  dividerAt: number | string;
  sync: React.RefObject<SideSync>;
  onCamera: (camera: CameraView) => void;
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        ...(side === 'a'
          ? { left: 0, width: dividerAt }
          : { left: dividerAt, right: 0 }),
      }}
    >
      <GeoVisProvider spec={sideSpec}>
        <GeoVisCanvas viewId={`split-${side}`} />
        <SideCameraSync side={side} sync={sync} onCamera={onCamera} />
      </GeoVisProvider>
    </div>
  );
};

/** The item a side's pill chose, or `null`. */
const itemOf = (
  { options, sides }: GeoVisMapModeContextValue,
  side: GeoVisSplitSide
) => {
  return (
    options.find((item) => {
      return item.id === sides[side];
    }) ?? null
  );
};

/**
 * The split map mode: two maps side by side, each a `<GeoVisProvider>` of its
 * own, with the cameras kept together, showing the `control` item its picker
 * chose — on the spec the app built for that side (`<GeoVisProvider split>`),
 * or else on the provider's spec. Each side carries its own tooltips; legends
 * are drawn once when both sides share a spec, and per side when the app
 * built them. The layer control steps aside, the pickers taking its place.
 * The divider sits in the middle of the map the app's panels leave free. With
 * the app's sides, the side being edited is ringed in its colour, and a click
 * on the other half makes it the one edited. Rendered by `<GeoVisCanvas>`
 * while the map mode is `split`.
 */
export const GeoVisSplitMap = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const { spec } = useGeoVis();
  const mode = useGeoVisMapMode();
  const { split, getCamera, recordCamera } = mode;
  const sync = React.useRef<SideSync>({
    runtimes: new Map(),
    mirroring: false,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const width = useWidth(containerRef);
  const { center, free } = dividerOf({ spec, width });
  const ownLegends = split !== null;

  const sideSpecs = {
    a: useSideSpec({
      source: split?.sides.a.spec ?? spec,
      item: itemOf(mode, 'a'),
      primary: false,
      ownLegends,
      getCamera,
    }),
    b: useSideSpec({
      source: split?.sides.b.spec ?? spec,
      item: itemOf(mode, 'b'),
      primary: true,
      ownLegends,
      getCamera,
    }),
  };
  const dividerAt = width > 0 ? center : '50%';

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        // Its own stacking context, as the single map's: the halves, divider
        // and pills stack inside the map, so a panel the app opens over it
        // covers them instead of them catching its clicks.
        isolation: 'isolate',
        ...style,
      }}
    >
      {SIDES.map((side) => {
        return (
          <SideMap
            key={side}
            side={side}
            sideSpec={sideSpecs[side]}
            dividerAt={dividerAt}
            sync={sync}
            onCamera={recordCamera}
          />
        );
      })}
      {split && <SplitHalves dividerAt={dividerAt} />}
      <Divider left={dividerAt} />
      <SplitPickers width={width} center={center} free={free} />
    </div>
  );
};
