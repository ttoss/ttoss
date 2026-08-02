import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Dialog as RACDialog,
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  type ModalOverlayProps as RACModalOverlayProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { PANEL_WIDTH, type PanelWidth } from '../../tokens/panelWidth';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Overlay → CONTRACT.md §1 row: colours `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, motion
// `transition`, elevation `overlay`.
//
// A Drawer is a modal surface anchored to one edge of the viewport instead of
// centred in it. Everything else it shares with `DialogModal`: React Aria's
// `ModalOverlay` scrim, focus containment, escape/outside dismissal, and the
// `Dialog` inside that carries the accessible name.
//
// Why it exists as its own composite rather than a prop on `DialogModal`. The
// edge anchor is not a position tweak — it changes what the surface *is*. A
// dialog interrupts to ask one question and is dismissed; a drawer is a region
// of the app brought temporarily into view, which is why it is the primitive
// every reference system reaches for when a persistent panel has nowhere to
// live: Chakra composes its narrow sidebar from `Drawer`, and MUI's `Drawer`
// carries the whole permanent/persistent/temporary axis. We had neither, which
// is the root of F-023 — no shell could answer a narrow viewport because the
// piece it would answer with did not exist.
//
// Unlike `Dialog`, this composite renders its own `RACDialog`: a drawer's
// content is a region, not a heading/body/actions triptych, so making callers
// wrap it would be ceremony with no slot to fill. Callers that want that
// triptych use `DialogModal`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Drawer surface (Overlay entity, edge panel). */
export const drawerMeta = {
  displayName: 'Drawer',
  entity: 'Overlay',
  structure: 'surface',
} as const satisfies ComponentMeta<'Overlay'>;

/** Which edge the drawer is anchored to. */
export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom';

type InformationalColors =
  (typeof vars.colors.informational)[EvaluationsFor<'Overlay'>];

/** Is this placement anchored to a vertical (inline) edge? */
const isInlineEdge = (placement: DrawerPlacement): boolean => {
  return placement === 'start' || placement === 'end';
};

/**
 * The active enter/exit motion spec, or `null` at rest. Mirrors `DialogModal`'s
 * resolver — same tokens, same phases.
 */
const resolveTransitionPhase = ({
  isEntering,
  isExiting,
}: {
  isEntering?: boolean;
  isExiting?: boolean;
}): { duration: string; easing: string } | null => {
  if (isEntering) return vars.motion.transition.enter;
  if (isExiting) return vars.motion.transition.exit;
  return null;
};

/** Scrim backdrop — dims the page and anchors the surface to one edge. */
const buildBackdropStyle = ({
  placement,
  isEntering,
  isExiting,
}: {
  placement: DrawerPlacement;
  isEntering?: boolean;
  isExiting?: boolean;
}): React.CSSProperties => {
  const phase = resolveTransitionPhase({ isEntering, isExiting });
  const inline = isInlineEdge(placement);
  return {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    // The flex axis places the surface: an inline edge pins it along the row,
    // a block edge along the column. `start`/`end` are logical, so an RTL
    // document anchors a `start` drawer on the right with no extra rule.
    flexDirection: inline ? 'row' : 'column',
    justifyContent:
      placement === 'start' || placement === 'top' ? 'flex-start' : 'flex-end',
    zIndex: vars.zIndex.layer.blocking,
    backgroundColor: vars.overlay.scrim,
    transition: phase ? `opacity ${phase.duration} ${phase.easing}` : undefined,
    opacity: isExiting ? 0 : 1,
  };
};

/**
 * Radius per corner. The anchored edge stays square: the panel is flush with
 * the viewport there, so rounding it would leave a sliver of scrim in the
 * corner. Keeping `surface` on the two free corners is what makes it read as a
 * panel rather than as a full-screen takeover.
 */
const cornerRadii = (placement: DrawerPlacement): React.CSSProperties => {
  const round = vars.radii.surface;
  const squareStart = placement === 'start';
  const squareEnd = placement === 'end';
  return {
    borderEndEndRadius: squareEnd ? 0 : round,
    borderEndStartRadius: squareStart ? 0 : round,
    borderStartEndRadius: squareEnd ? 0 : round,
    borderStartStartRadius: squareStart ? 0 : round,
  };
};

/**
 * Box on both axes. An edge panel is sized on the axis it slides along and
 * full-bleed on the other — that is what makes it read as a region of the app
 * rather than a card floating in the middle of one.
 */
const panelBox = ({
  placement,
  width,
}: {
  placement: DrawerPlacement;
  width: PanelWidth;
}): React.CSSProperties => {
  const inline = isInlineEdge(placement);
  return {
    blockSize: inline ? '100%' : 'auto',
    inlineSize: inline ? PANEL_WIDTH[width] : '100%',
    maxBlockSize: '100%',
    maxInlineSize: '100%',
  };
};

/** Enter/exit travel: the panel slides in from the edge it is anchored to. */
const panelMotion = ({
  placement,
  isEntering,
  isExiting,
}: {
  placement: DrawerPlacement;
  isEntering?: boolean;
  isExiting?: boolean;
}): React.CSSProperties => {
  const phase = resolveTransitionPhase({ isEntering, isExiting });
  const inTransition = isEntering || isExiting;
  const away = placement === 'start' || placement === 'top' ? '-100%' : '100%';
  const axis = isInlineEdge(placement) ? 'translateX' : 'translateY';

  return {
    opacity: inTransition ? 0 : 1,
    transform: inTransition ? `${axis}(${away})` : `${axis}(0)`,
    transition: phase
      ? `transform ${phase.duration} ${phase.easing}, opacity ${phase.duration} ${phase.easing}`
      : undefined,
  };
};

/** The panel itself — full-bleed on its cross axis, sized on its main axis. */
const buildSurfaceStyle = ({
  colors,
  placement,
  width,
  isEntering,
  isExiting,
}: {
  colors: InformationalColors;
  placement: DrawerPlacement;
  width: PanelWidth;
  isEntering?: boolean;
  isExiting?: boolean;
}): React.CSSProperties => {
  return {
    ...panelBox({ placement, width }),
    ...cornerRadii(placement),
    ...panelMotion({ isEntering, isExiting, placement }),
    backgroundColor: colors?.background?.default,
    borderColor: colors?.border?.default,
    borderStyle: vars.border.outline.surface.style,
    borderWidth: vars.border.outline.surface.width,
    boxShadow: vars.elevation.surface.overlay,
    boxSizing: 'border-box',
    // A definite inline size makes the panel a size container, so the theme's
    // `cqi` scales resolve against the drawer rather than the viewport
    // (ADR-011) — the same reason `AppShell`'s regions declare it.
    containerType: 'inline-size',
    outline: 'none',
    overflow: 'auto',
  };
};

/** Props for the Drawer composite. */
export interface DrawerProps extends Omit<
  RACModalOverlayProps,
  'style' | 'className' | 'children'
> {
  /**
   * Which edge the panel is anchored to. `start`/`end` are logical — a `start`
   * drawer anchors right in an RTL document.
   * @default 'start'
   */
  placement?: DrawerPlacement;
  /**
   * Panel measure on its main axis, from the named scale shared with
   * `AppShell`'s side regions — so a drawer standing in for a sidebar is the
   * same width the sidebar would have been. Ignored for `top`/`bottom`, which
   * are sized by their content.
   * @default 'sm'
   */
  width?: PanelWidth;
  /**
   * Semantic emphasis for the surface colours.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof drawerMeta)['entity']>;
  /**
   * Accessible name for the panel. Required: the drawer renders a dialog, and
   * a dialog without a name is announced as an unlabelled region (ADR-001 —
   * flow-critical copy is caller-supplied, never defaulted in English).
   */
  'aria-label': string;
  /** The panel's content. */
  children?: React.ReactNode;
}

/**
 * A modal panel anchored to one edge of the viewport.
 *
 * Entity = Overlay. Use it for a region of the app that has nowhere to live
 * right now: navigation on a narrow viewport, a filter panel, a detail
 * inspector. It brings React Aria's focus containment, escape and
 * outside-press dismissal, and page-scroll locking.
 *
 * Controlled (`isOpen` + `onOpenChange`) or wrapped in a `DialogTrigger` for
 * the uncontrolled case. For an interrupting question with a heading, body and
 * action row, use `DialogModal` instead — a drawer is a region, not a prompt.
 *
 * @example
 * ```tsx
 * <Drawer
 *   isOpen={isOpen}
 *   onOpenChange={setOpen}
 *   placement="start"
 *   aria-label="Navigation"
 * >
 *   <Nav />
 * </Drawer>
 * ```
 */
export const Drawer = ({
  placement = 'start',
  width = 'sm',
  evaluation = 'primary',
  children,
  ...props
}: DrawerProps) => {
  const colors = vars.colors.informational[evaluation];
  const label = props['aria-label'];

  return (
    <RACModalOverlay
      {...props}
      data-scope="drawer"
      data-part="backdrop"
      style={({ isEntering, isExiting }) => {
        return buildBackdropStyle({ isEntering, isExiting, placement });
      }}
    >
      <RACModal
        data-scope="drawer"
        data-part="surface"
        data-evaluation={evaluation}
        data-placement={placement}
        style={({ isEntering, isExiting }) => {
          return buildSurfaceStyle({
            colors,
            isEntering,
            isExiting,
            placement,
            width,
          });
        }}
      >
        <RACDialog
          aria-label={label}
          data-scope="drawer"
          data-part="content"
          style={{
            blockSize: '100%',
            boxSizing: 'border-box',
            outline: 'none',
            padding: vars.spacing.inset.surface.md,
          }}
        >
          {children}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  );
};
Drawer.displayName = drawerMeta.displayName;
