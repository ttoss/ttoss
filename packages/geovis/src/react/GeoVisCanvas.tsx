import * as React from 'react';

import { useGeoVis } from './GeoVisProvider';

interface GeoVisCanvasProps {
  viewId: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Renders a map canvas managed by the GeoVis runtime.
 * Must be used inside a {@link GeoVisProvider}.
 * The component mounts the engine's native map into a `<div>` and
 * unmounts it automatically when removed from the tree.
 */
export const GeoVisCanvas = ({
  viewId,
  style,
  className,
}: GeoVisCanvasProps) => {
  const { runtime } = useGeoVis();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!runtime || !container) return;

    const mounted = runtime.mount(container, viewId);
    return () => {
      mounted.destroy();
    };
  }, [runtime, viewId]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    />
  );
};
