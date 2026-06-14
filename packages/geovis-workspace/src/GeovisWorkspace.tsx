import type * as React from 'react';

import { Layout } from './components/Layout';
import { type GeovisWorkspaceSpec } from './context/GeovisWorkspaceContext';
import { GeovisWorkspaceProvider } from './GeovisWorkspaceProvider';

export interface GeovisWorkspaceProps {
  /** Content rendered in the main area (typically a map component). */
  children?: React.ReactNode;
  /** Spec describing the left and right sidebars. */
  spec: GeovisWorkspaceSpec;
  /** Called whenever an item in a menu group is selected. */
  onSelect?: ({ menuId, value }: { menuId: string; value: string }) => void;
}

/**
 * High-level component that composes a left sidebar (menu groups), a main
 * content area (children), and an optional right sidebar — all driven by a
 * single `spec` object. Sidebars only render when defined in the spec.
 *
 * Internal state is managed by GeovisWorkspaceProvider so consumers only need:
 *
 * ```tsx
 * <GeovisWorkspace spec={spec} onSelect={({ menuId, value }) => {}}>
 *   <MyMapComponent />
 * </GeovisWorkspace>
 * ```
 */
export const GeovisWorkspace = ({
  children,
  spec,
  onSelect,
}: GeovisWorkspaceProps) => {
  return (
    <GeovisWorkspaceProvider spec={spec} onSelect={onSelect}>
      <Layout>{children}</Layout>
    </GeovisWorkspaceProvider>
  );
};
