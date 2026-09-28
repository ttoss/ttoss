import * as React from 'react';

import type { LayerControl, VisualizationSpec } from '../spec/types';
import type { useGeoVis } from './contexts';
import { resolveItemActive } from './GeoVisLayerControl.items';

export type SetExpanded = React.Dispatch<React.SetStateAction<boolean>>;

/**
 * Hover/focus handlers that expand the panel, active only for the `hover`
 * trigger. Returns an empty object for the `click` trigger so the panel opens
 * solely from the trigger button's `onClick`.
 */
export const buildHoverHandlers = ({
  trigger,
  pinned,
  setExpanded,
}: {
  trigger: string;
  /**
   * Whether the full panel is open. It was opened by an explicit click, so a
   * stray pointer or focus leaving the control must not close it — only its
   * own dismissals do (close button, `Escape`, click outside).
   */
  pinned: boolean;
  setExpanded: SetExpanded;
}): React.HTMLAttributes<HTMLDivElement> => {
  if (trigger !== 'hover') return {};
  return {
    onMouseEnter: () => {
      return setExpanded(true);
    },
    onMouseLeave: () => {
      if (pinned) return;
      setExpanded(false);
    },
    onFocus: () => {
      return setExpanded(true);
    },
    onBlur: (event) => {
      // Collapse only when focus leaves the whole panel, not when it moves
      // between the trigger and the item buttons inside it.
      if (pinned) return;
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setExpanded(false);
      }
    },
  };
};

/**
 * Closes the full panel on `Escape` or on a pointer press outside `ref`, while
 * `active`. The trigger and its `trailing` sibling live inside `ref`, so
 * pressing the trigger toggles the panel through its own `onClick` instead.
 */
export const useDismissFullPanel = ({
  active,
  ref,
  onDismiss,
}: {
  active: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
  onDismiss: () => void;
}) => {
  // Latest callback, read by the listeners without re-subscribing them on
  // every render (the caller's `setExpanded` is a fresh function each time).
  const onDismissRef = React.useRef(onDismiss);
  React.useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  React.useEffect(() => {
    if (!active) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      onDismissRef.current();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismissRef.current();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, ref]);
};

/**
 * The panel's open flag, controlled by the caller when it passes both
 * `expanded` and `onExpandedChange`, and owned here otherwise. Uncontrolled
 * updates forward the `SetStateAction` untouched, so a functional update still
 * reads React's latest value rather than this render's.
 */
export const useExpandedState = ({
  expanded,
  onExpandedChange,
}: {
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}): [boolean, SetExpanded] => {
  const [owned, setOwned] = React.useState(false);
  const current = expanded ?? owned;
  const setExpanded: SetExpanded = (action) => {
    if (!onExpandedChange) {
      setOwned(action);
      return;
    }
    onExpandedChange(typeof action === 'function' ? action(current) : action);
  };
  return [current, setExpanded];
};

/**
 * Re-applies the remembered on/off choices to the live map whenever the spec
 * or a choice changes. This is what makes the state persist across spec
 * rebuilds: a fresh spec resets `layer.visible`, and this effect drives each
 * referenced-and-existing layer back to its intended visibility. Each
 * `dispatch` is idempotent (explicit `visible`) and only fires on a genuine
 * mismatch, so the resulting spec update re-runs this effect to a fixpoint
 * rather than looping.
 */
export const useLayerVisibilitySync = ({
  control,
  layers,
  activeById,
  dispatch,
}: {
  control: LayerControl | undefined;
  layers: VisualizationSpec['layers'];
  activeById: Record<string, boolean>;
  dispatch: ReturnType<typeof useGeoVis>['dispatch'];
}) => {
  React.useEffect(() => {
    if (!control) return;
    for (const item of control.items) {
      const desired = resolveItemActive(item, activeById);
      for (const layer of layers) {
        if (!item.layers.includes(layer.id)) continue;
        const currentlyVisible = layer.visible !== false;
        if (currentlyVisible !== desired) {
          dispatch({
            type: 'toggle-layer',
            layerId: layer.id,
            visible: desired,
          });
        }
      }
    }
  }, [control, layers, activeById, dispatch]);
};

/**
 * Whether the full panel replaces the summary strip. Only meaningful while
 * `expanded`, and reset whenever the control collapses — however that happens
 * (trigger, dismissal, or the compact bar opening the legend instead) — so the
 * next expansion starts from the summary strip. The reset happens during
 * render rather than in an effect, so a collapsed-then-reopened control never
 * paints the stale full panel for a frame.
 */
export const useShowAll = (expanded: boolean): [boolean, () => void] => {
  const [showAll, setShowAll] = React.useState(false);
  if (!expanded && showAll) setShowAll(false);
  return [
    expanded && showAll,
    () => {
      return setShowAll(true);
    },
  ];
};
