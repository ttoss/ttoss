import * as React from 'react';

import { layerControlItems } from '../spec/layerControl';
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
   * Whether a panel opened by an explicit click is up — the full panel or a
   * category's. A stray pointer or focus leaving the control must not close
   * it; only its own dismissals do (close button, `Escape`, click outside).
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
    // A category holds no layers of its own: its items are the toggles.
    for (const item of layerControlItems(control.items)) {
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
 * Which panel the expanded control shows: the summary strip, the full panel
 * ("Ver mais"), or a category's panel — which can be opened from either, and
 * whose back button returns to whichever it was opened from.
 */
export type ControlView = { full: boolean; groupId: string | null };

const STRIP: ControlView = { full: false, groupId: null };

/**
 * The expanded control's view (see {@link ControlView}). Only meaningful while
 * `expanded`, and reset whenever the control collapses — however that happens
 * (trigger, dismissal, or the compact bar opening the legend instead) — so the
 * next expansion starts from the summary strip. The reset happens during
 * render rather than in an effect, so a collapsed-then-reopened control never
 * paints a stale panel for a frame.
 *
 * @param expanded - Whether the control is expanded.
 * @returns The view, whether it is pinned open (anything but the strip), and
 *   the moves between views.
 */
export const useControlView = (expanded: boolean) => {
  const [view, setView] = React.useState<ControlView>(STRIP);
  if (!expanded && (view.full || view.groupId !== null)) setView(STRIP);
  const current = expanded ? view : STRIP;

  return {
    view: current,
    pinned: current.full || current.groupId !== null,
    openFull: () => {
      setView((prev) => {
        return { ...prev, full: true };
      });
    },
    openGroup: (groupId: string) => {
      setView((prev) => {
        return { ...prev, groupId };
      });
    },
    // Leaves the category for the view it was opened from.
    back: () => {
      setView((prev) => {
        return { ...prev, groupId: null };
      });
    },
  };
};
