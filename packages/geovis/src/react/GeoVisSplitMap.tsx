import * as React from 'react';

import type { CameraView } from '../runtime/adapter';
import type { GeoVisRuntime } from '../runtime/createRuntime';
import { useGeoVis } from './contexts';
import { GeoVisCanvas } from './GeoVisCanvas';
import { GeoVisProvider } from './GeoVisProvider';
import {
  pickerPlacement,
  SidePicker,
  useDismissPicker,
} from './GeoVisSplitMap.picker';
import {
  deriveSplitSideSpec,
  type GeoVisSplitSide,
  useGeoVisMapMode,
} from './mapMode';

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

/** The vertical line between the sides, with its handle. */
const Divider = () => {
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
          left: '50%',
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
          left: '50%',
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
 * The split map mode: two maps side by side, each a `<GeoVisProvider>` of its
 * own over the spec of the provider it sits in, showing the `control` item its
 * picker chose, with the cameras kept together. Each side carries its own
 * tooltips, and only the right side draws legends, so one both sides share is
 * not drawn twice; the layer control steps aside, the pickers taking its
 * place. Rendered by `<GeoVisCanvas>` while the map mode is `split`.
 */
export const GeoVisSplitMap = ({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) => {
  const { spec } = useGeoVis();
  const { options, sides, getCamera, recordCamera } = useGeoVisMapMode();
  const sync = React.useRef<SideSync>({
    runtimes: new Map(),
    mirroring: false,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const width = useWidth(containerRef);
  const stacked = width > 0 && width < STACK_BELOW;
  const [openPicker, setOpenPicker] = React.useState<GeoVisSplitSide | null>(
    null
  );
  const closePicker = React.useCallback(() => {
    setOpenPicker(null);
  }, []);
  useDismissPicker(openPicker, closePicker);

  const itemFor = React.useCallback(
    (side: GeoVisSplitSide) => {
      return (
        options.find((item) => {
          return item.id === sides[side];
        }) ?? null
      );
    },
    [options, sides]
  );

  const itemA = itemFor('a');
  const itemB = itemFor('b');
  // Rebuilt only when the spec or the side's item changes, reading the latest
  // camera then — so an update never throws the camera back to where it was.
  const specA = React.useMemo(() => {
    return deriveSplitSideSpec({
      spec,
      item: itemA,
      camera: getCamera(),
      primary: false,
    });
  }, [spec, itemA, getCamera]);
  const specB = React.useMemo(() => {
    return deriveSplitSideSpec({
      spec,
      item: itemB,
      camera: getCamera(),
      primary: true,
    });
  }, [spec, itemB, getCamera]);
  const sideSpecs = { a: specA, b: specB };

  const pillMax = Math.max(
    80,
    Math.floor(stacked ? width - 16 : width / 2 - 24)
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {SIDES.map((side) => {
        const sideSpec = sideSpecs[side];
        return (
          <div
            key={side}
            style={{ position: 'relative', flex: 1, minWidth: 0 }}
          >
            <GeoVisProvider spec={sideSpec}>
              <GeoVisCanvas viewId={`split-${side}`} />
              <SideCameraSync side={side} sync={sync} onCamera={recordCamera} />
            </GeoVisProvider>
          </div>
        );
      })}
      <Divider />
      {SIDES.map((side) => {
        const placement = pickerPlacement(side, stacked);
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
          />
        );
      })}
    </div>
  );
};
