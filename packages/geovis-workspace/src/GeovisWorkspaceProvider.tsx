import type { RepairOption } from '@ttoss/geovis';
import * as React from 'react';

import {
  type GeovisWorkspaceConfig,
  GeovisWorkspaceContext,
  type GeovisWorkspacePendingSelection,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';

export interface GeovisWorkspaceProviderProps {
  /** Content to render inside the provider. */
  children: React.ReactNode;
  /** Config describing the sidebars. */
  config: GeovisWorkspaceConfig;
  /**
   * Active item value per menu group, keyed by menu id. Provide it to control
   * the selection from the parent. Omit it to let the provider manage the
   * selection internally (seeded from each menu's `defaultValue`).
   */
  selection?: GeovisWorkspaceSelection;
  /**
   * Called with the full next selection whenever a variation is chosen (or the
   * timeline advances). Use it to rebuild the `visualizationSpec` in the parent.
   *
   * Return a promise when serving a *variation* costs a request, and the menus
   * go inert until it settles — no second pick can race the first, and none is
   * queued behind it. Nothing else has to be wired: the promise is the signal.
   * A rejection re-enables them the same way a resolve does, since a failed
   * request is a reason to let the user try again, not to strand the sidebar.
   * Returns from a timeline tick are ignored (see `setSelection`).
   */
  onSelectionChange?: (
    selection: GeovisWorkspaceSelection
  ) => void | Promise<unknown>;
  /**
   * Called with the chosen `RepairOption` when a repair button is pressed in
   * the `warnings` slot's default panel. Omit to render repair buttons
   * disabled rather than absent.
   */
  onRepair?: (repair: RepairOption) => void;
  /**
   * Whether the GeoVis runtime has ever resolved successfully. Computed by
   * `GeovisWorkspace` (which has runtime access) and forwarded here so it
   * reaches context; defaults to `false` for standalone usage without a
   * GeoVis runtime.
   */
  hasResolvedOnce?: boolean;
  /**
   * Whether the left sidebar is open. Provide it to control the open state
   * from the parent (as `GeovisWorkspace` does, so it can shift the map's
   * layer control clear of the open sidebar). Omit it to let the provider
   * manage the state internally (seeded from `config.leftSidebar.initialState`).
   */
  isLeftSidebarOpen?: boolean;
  /**
   * Called with the next open state whenever the left sidebar is opened or
   * closed. Pair it with `isLeftSidebarOpen` to control the open state.
   */
  onLeftSidebarOpenChange?: (open: boolean) => void;
  /**
   * Whether the right sidebar is open. Provide it to control the open state
   * from the parent (as `GeovisWorkspace` does, so it can shift a right-anchored
   * legend clear of the open sidebar). Omit it to let the provider manage the
   * state internally (seeded from `config.rightSidebar.initialState`).
   */
  isRightSidebarOpen?: boolean;
  /**
   * Called with the next open state whenever the right sidebar is opened or
   * closed. Pair it with `isRightSidebarOpen` to control the open state.
   */
  onRightSidebarOpenChange?: (open: boolean) => void;
  /**
   * Whether the compact timeline HUD is showing. Decided by `GeovisWorkspace`,
   * which needs the same flag to lift the map's layer control clear of the bar.
   * Defaults to `false`, so the provider is usable standalone.
   */
  isTimelineHudVisible?: boolean;
  /** Called when timeline playback begins — what arms the HUD. */
  onPlaybackStart?: () => void;
  /** Called when the HUD's close button is pressed. */
  onTimelineHudDismiss?: () => void;
}

/**
 * Builds the initial selection from every menu the left sidebar declares: a
 * `variations` section body, and a `variations` control inside a `filters`
 * body. Each seeds `selection[menuId]` with its `defaultValue`, so a menu is
 * seeded the same way whichever of the two surfaces it is declared on.
 *
 * Timeline filters are intentionally NOT seeded here — `useTimeline` publishes a
 * timeline's default to the shared selection on mount, so seeding it here would
 * suppress that publish and leave uncontrolled consumers unaware of the initial
 * value. Use it to seed the parent's selection state when controlling the
 * workspace.
 */
export const getInitialSelection = ({
  config,
}: {
  config: GeovisWorkspaceConfig;
}): GeovisWorkspaceSelection => {
  const selection: GeovisWorkspaceSelection = {};

  for (const section of config.leftSidebar?.sections ?? []) {
    const { body } = section;

    if (body.kind === 'variations') {
      selection[body.menuId] = body.defaultValue;
      continue;
    }

    for (const block of body.blocks) {
      if (block.control.kind === 'variations') {
        selection[block.control.menuId] = block.control.defaultValue;
      }
    }
  }

  return selection;
};

/**
 * Provides shared state for GeovisWorkspace and all internal components.
 * Manages the per-group selection (controlled or uncontrolled) and the sidebar
 * open state, exposing them via useGeovisWorkspace.
 */
export const GeovisWorkspaceProvider = ({
  children,
  config,
  selection,
  onSelectionChange,
  onRepair,
  hasResolvedOnce = false,
  isLeftSidebarOpen: leftSidebarOpenProp,
  onLeftSidebarOpenChange,
  isRightSidebarOpen: rightSidebarOpenProp,
  onRightSidebarOpenChange,
  isTimelineHudVisible = false,
  onPlaybackStart,
  onTimelineHudDismiss,
}: GeovisWorkspaceProviderProps) => {
  const isControlled = selection !== undefined;

  const [internalSelection, setInternalSelection] =
    React.useState<GeovisWorkspaceSelection>(() => {
      return getInitialSelection({ config });
    });

  const currentSelection = isControlled ? selection : internalSelection;

  const isLeftControlled = leftSidebarOpenProp !== undefined;

  const [internalLeftSidebarOpen, setInternalLeftSidebarOpen] = React.useState(
    () => {
      return config.leftSidebar?.initialState === 'open';
    }
  );

  const isLeftSidebarOpen = isLeftControlled
    ? leftSidebarOpenProp
    : internalLeftSidebarOpen;

  const isRightControlled = rightSidebarOpenProp !== undefined;

  const [internalRightSidebarOpen, setInternalRightSidebarOpen] =
    React.useState(() => {
      return config.rightSidebar?.initialState === 'open';
    });

  const isRightSidebarOpen = isRightControlled
    ? rightSidebarOpenProp
    : internalRightSidebarOpen;

  const [pendingSelection, setPendingSelection] = React.useState<
    GeovisWorkspacePendingSelection | undefined
  >(undefined);

  /*
   * Names the wait that is current. A settle only clears the pending state when
   * its own token is still the live one, so a promise that resolves late — the
   * consumer swapped handlers, or a slow first request landing after a faster
   * second — cannot unlock menus that a newer wait has since locked.
   */
  const waitToken = React.useRef(0);

  const setSelection = React.useCallback(
    ({
      menuId,
      value,
      blocking = false,
    }: {
      menuId: string;
      value: string;
      blocking?: boolean;
    }) => {
      const next = { ...currentSelection, [menuId]: value };

      if (!isControlled) {
        setInternalSelection(next);
      }

      const result = onSelectionChange?.(next);

      // A thenable is the consumer saying it is not done yet. Anything else —
      // including every timeline tick, which never asks to block — leaves the
      // sidebar as responsive as it was.
      const thenable = result as Promise<unknown> | undefined;

      if (!blocking || typeof thenable?.then !== 'function') {
        return;
      }

      const token = waitToken.current + 1;
      waitToken.current = token;
      setPendingSelection({ menuId, value });

      const release = () => {
        if (waitToken.current === token) {
          setPendingSelection(undefined);
        }
      };

      void Promise.resolve(thenable).then(release, release);
    },
    [currentSelection, isControlled, onSelectionChange]
  );

  const setLeftSidebarOpen = React.useCallback(
    ({ open }: { open: boolean }) => {
      if (!isLeftControlled) {
        setInternalLeftSidebarOpen(open);
      }

      onLeftSidebarOpenChange?.(open);
    },
    [isLeftControlled, onLeftSidebarOpenChange]
  );

  const setRightSidebarOpen = React.useCallback(
    ({ open }: { open: boolean }) => {
      if (!isRightControlled) {
        setInternalRightSidebarOpen(open);
      }

      onRightSidebarOpenChange?.(open);
    },
    [isRightControlled, onRightSidebarOpenChange]
  );

  const notifyPlaybackStart = React.useCallback(() => {
    onPlaybackStart?.();
  }, [onPlaybackStart]);

  const dismissTimelineHud = React.useCallback(() => {
    onTimelineHudDismiss?.();
  }, [onTimelineHudDismiss]);

  const value = React.useMemo(() => {
    return {
      config,
      selection: currentSelection,
      setSelection,
      pendingSelection,
      isLeftSidebarOpen,
      setLeftSidebarOpen,
      isRightSidebarOpen,
      setRightSidebarOpen,
      isTimelineHudVisible,
      dismissTimelineHud,
      notifyPlaybackStart,
      onRepair,
      hasResolvedOnce,
    };
  }, [
    config,
    currentSelection,
    setSelection,
    pendingSelection,
    isLeftSidebarOpen,
    setLeftSidebarOpen,
    isRightSidebarOpen,
    setRightSidebarOpen,
    isTimelineHudVisible,
    dismissTimelineHud,
    notifyPlaybackStart,
    onRepair,
    hasResolvedOnce,
  ]);

  return (
    <GeovisWorkspaceContext.Provider value={value}>
      {children}
    </GeovisWorkspaceContext.Provider>
  );
};
