import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';

import { Drawer } from '../../composites/Drawer/Drawer';
import type { ComponentMeta } from '../../semantics';
import { PANEL_WIDTH, type PanelWidth } from '../../tokens/panelWidth';
import { ActionButton } from '../ActionButton/ActionButton';
import { Icon } from '../Icon/Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: border `outline.surface`. AppShell
// is the application-frame primitive: a full-viewport grid of an optional
// header over a body of an optional start sidebar, the main region, and an
// optional end aside. Each region scrolls independently; the frame fills the
// viewport (`100dvh`). It replaces the hand-rolled "sidebar | main | inspector"
// grid every app otherwise re-implements. Column widths come from a named
// threshold scale (not raw lengths); the main region always takes the rest.
// It consumes only the surface hairline colour.
// ---------------------------------------------------------------------------

/** Formal semantic identity — AppShell root (Structure entity, app frame). */
export const appShellMeta = {
  displayName: 'AppShell',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/**
 * Sidebar width from a named threshold scale (not a raw length).
 *
 * Aliases the shared `PanelWidth` scale so a sidebar and the `Drawer` that
 * stands in for it are the same measure.
 */
export type AppShellSidebarWidth = PanelWidth;

/**
 * How the start `sidebar` occupies the frame. The axis is the reference
 * systems' — MUI names exactly this distinction on its `Drawer`, and Chakra
 * composes the same two shapes by hand — and it lives on the navigation region
 * rather than on the shell, because that is the part whose behaviour changes.
 *
 * - `permanent` — a grid track beside the main region. The desktop shape.
 * - `temporary` — no track: the sidebar lives in a `Drawer` reached from a
 *   trigger in the header row. The shape a viewport too narrow for a track
 *   needs, and the answer to a shell that would otherwise overflow.
 *
 * Choosing between them is the **app's** call, not the shell's, which is how
 * both references draw the line: the app knows its own breakpoints and whether
 * a pointer is coarse; the shell knows neither.
 */
export type AppShellSidebarVariant = 'permanent' | 'temporary';

/** Props for the AppShell component. */
export interface AppShellProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /** Top bar, spanning the full width above the body. Omit for no header. */
  header?: React.ReactNode;
  /** Start-side panel (navigator). Omit for no start sidebar. */
  sidebar?: React.ReactNode;
  /** End-side panel (inspector). Omit for no end aside. */
  aside?: React.ReactNode;
  /**
   * Width of the start `sidebar`, from the named scale.
   * @default 'sm'
   */
  sidebarWidth?: AppShellSidebarWidth;
  /**
   * Width of the end `aside`, from the named scale.
   * @default 'sm'
   */
  asideWidth?: AppShellSidebarWidth;
  /** Accessible name for the start `sidebar` landmark (`aria-label`). */
  sidebarLabel?: string;
  /** Accessible name for the end `aside` landmark (`aria-label`). */
  asideLabel?: string;
  /**
   * How the start `sidebar` occupies the frame.
   *
   * `temporary` needs `sidebarTriggerLabel` to name the button that reveals
   * the panel — without a name the sidebar would be unreachable, so the shell
   * stays `permanent` rather than hide it (an English default is forbidden by
   * ADR-001, and a scrolling shell beats a lost one).
   * @default 'permanent'
   */
  sidebarVariant?: AppShellSidebarVariant;
  /**
   * Accessible name for the button that opens a `temporary` sidebar — e.g.
   * "Open navigation". Required for `temporary` to take effect.
   */
  sidebarTriggerLabel?: string;
  /** Whether a `temporary` sidebar is open. Omit to let the shell own it. */
  isSidebarOpen?: boolean;
  /** Called when a `temporary` sidebar opens or closes. */
  onSidebarOpenChange?: (isOpen: boolean) => void;
  /** The main region — always takes the remaining space and scrolls. */
  children?: React.ReactNode;
}

/** Build the body's column template from which side panels are present. */
const bodyColumns = ({
  hasSidebar,
  hasAside,
  sidebarWidth,
  asideWidth,
}: {
  hasSidebar: boolean;
  hasAside: boolean;
  sidebarWidth: AppShellSidebarWidth;
  asideWidth: AppShellSidebarWidth;
}): string => {
  const start = hasSidebar ? `${PANEL_WIDTH[sidebarWidth]} ` : '';
  const end = hasAside ? ` ${PANEL_WIDTH[asideWidth]}` : '';
  return `${start}minmax(0, 1fr)${end}`;
};

/**
 * The button that reveals a temporary sidebar.
 *
 * No `data-scope`/`data-part` of its own: it *is* an `ActionButton` and already
 * publishes that pair. A second scope on one element is the ambiguity F-026 and
 * F-030 were filed for, so it is addressable the way a control should be — by
 * role and accessible name.
 */
const SidebarTrigger = ({
  label,
  onOpen,
}: {
  label: string;
  onOpen: (isOpen: boolean) => void;
}) => {
  return (
    <ActionButton
      aria-label={label}
      evaluation="muted"
      icon={<Icon intent="navigation.menu" />}
      onPress={() => {
        return onOpen(true);
      }}
    />
  );
};

/**
 * Resolves the sidebar's mode and its open state.
 *
 * Extracted from the component body rather than inlined: the shell's render is
 * already a four-region grid, and the two concerns here — *whether* the panel
 * is temporary and *whether it is open* — answer different questions with
 * different owners (the app decides the first, either side may own the second).
 */
const useTemporarySidebar = ({
  sidebar,
  sidebarLabel,
  sidebarTriggerLabel,
  sidebarVariant,
  sidebarWidth,
  isSidebarOpen,
  onSidebarOpenChange,
}: {
  sidebar?: React.ReactNode;
  sidebarLabel?: string;
  sidebarTriggerLabel?: string;
  sidebarVariant: AppShellSidebarVariant;
  sidebarWidth: AppShellSidebarWidth;
  isSidebarOpen?: boolean;
  onSidebarOpenChange?: (isOpen: boolean) => void;
}) => {
  // Uncontrolled by default so the common case needs no state in the host;
  // `isSidebarOpen` takes over the moment it is supplied.
  const [openState, setOpenState] = React.useState(false);

  // `temporary` only takes effect once the trigger can be named: a panel with
  // no way in is worse than the horizontal scroll it was meant to fix, and the
  // name cannot be defaulted (ADR-001).
  const isTemporary =
    sidebar != null &&
    sidebarVariant === 'temporary' &&
    sidebarTriggerLabel !== undefined;

  if (!isTemporary) {
    return { drawer: null, isTemporary, trigger: null };
  }

  const isOpen = isSidebarOpen ?? openState;
  const setOpen = (next: boolean) => {
    if (isSidebarOpen === undefined) setOpenState(next);
    onSidebarOpenChange?.(next);
  };

  return {
    drawer: (
      <Drawer
        aria-label={sidebarLabel ?? sidebarTriggerLabel}
        isOpen={isOpen}
        onOpenChange={setOpen}
        placement="start"
        width={sidebarWidth}
      >
        {sidebar}
      </Drawer>
    ),
    isTemporary,
    trigger: <SidebarTrigger label={sidebarTriggerLabel} onOpen={setOpen} />,
  };
};

const HAIRLINE = `${vars.border.outline.surface.width} ${vars.border.outline.surface.style} ${vars.colors.informational.muted.border?.default}`;

/**
 * A side region of the frame. `sidebar` and `aside` are the same object
 * mirrored across the main region — one grid track, its own scroll, a hairline
 * on the edge that faces the content — so they are one component rather than
 * two near-identical blocks that can drift apart.
 */
const SidePanel = ({
  side,
  label,
  children,
}: {
  side: 'sidebar' | 'aside';
  label?: string;
  children: React.ReactNode;
}) => {
  const facesContent =
    side === 'sidebar'
      ? { borderInlineEnd: HAIRLINE }
      : { borderInlineStart: HAIRLINE };

  return (
    <aside
      aria-label={label}
      data-scope="app-shell"
      data-part={side}
      style={
        {
          ...facesContent,
          containerType: 'inline-size',
          overflowY: 'auto',
        } as React.CSSProperties
      }
    >
      {children}
    </aside>
  );
};

/**
 * The frame below the header: the optional side regions flanking `main`.
 *
 * Its own component because the grid template and the three regions that fill
 * it are one decision — which panels exist — answered in one place instead of
 * re-tested at each slot.
 */
const ShellBody = ({
  sidebar,
  aside,
  sidebarWidth,
  asideWidth,
  sidebarLabel,
  asideLabel,
  children,
}: {
  sidebar?: React.ReactNode;
  aside?: React.ReactNode;
  sidebarWidth: AppShellSidebarWidth;
  asideWidth: AppShellSidebarWidth;
  sidebarLabel?: string;
  asideLabel?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      data-scope="app-shell"
      data-part="body"
      style={
        {
          display: 'grid',
          gridTemplateColumns: bodyColumns({
            asideWidth,
            hasAside: aside !== undefined,
            hasSidebar: sidebar !== undefined,
            sidebarWidth,
          }),
          minBlockSize: 0,
        } as React.CSSProperties
      }
    >
      {sidebar === undefined ? null : (
        <SidePanel side="sidebar" label={sidebarLabel}>
          {sidebar}
        </SidePanel>
      )}
      <main
        data-scope="app-shell"
        data-part="main"
        style={
          {
            containerType: 'inline-size',
            minInlineSize: 0,
            overflow: 'auto',
          } as React.CSSProperties
        }
      >
        {children}
      </main>
      {aside === undefined ? null : (
        <SidePanel side="aside" label={asideLabel}>
          {aside}
        </SidePanel>
      )}
    </div>
  );
};

/**
 * The application-frame primitive — a full-viewport header + sidebars + main.
 *
 * Entity = Structure. Wrap the whole app in an AppShell to get the standard
 * "header over navigator | main | inspector" frame without hand-rolling a grid:
 * pass any of `header`, `sidebar`, `aside`, and the main content as `children`.
 * The frame fills the viewport, each region scrolls on its own, and the main
 * region always takes the remaining width. Sidebar widths come from a named
 * scale — there is no raw track template.
 *
 * @example
 * ```tsx
 * <AppShell
 *   header={<Toolbar>…</Toolbar>}
 *   sidebar={<Navigator />}
 *   aside={<Inspector />}
 * >
 *   <MainStage />
 * </AppShell>
 * ```
 */
export const AppShell = ({
  header,
  sidebar,
  aside,
  sidebarWidth = 'sm',
  asideWidth = 'sm',
  sidebarLabel,
  asideLabel,
  sidebarVariant = 'permanent',
  sidebarTriggerLabel,
  isSidebarOpen,
  onSidebarOpenChange,
  children,
  ...props
}: AppShellProps) => {
  const { drawer, isTemporary, trigger } = useTemporarySidebar({
    isSidebarOpen,
    onSidebarOpenChange,
    sidebar,
    sidebarLabel,
    sidebarTriggerLabel,
    sidebarVariant,
    sidebarWidth,
  });

  // A temporary sidebar forces a header row into existence even when the host
  // supplied none — otherwise the trigger has nowhere to live and the panel is
  // unreachable, which is the failure this variant exists to prevent.
  const hasHeaderRow = header !== undefined || isTemporary;

  return (
    <div
      {...props}
      data-scope="app-shell"
      data-part="root"
      style={
        {
          display: 'grid',
          gridTemplateRows: hasHeaderRow
            ? 'auto minmax(0, 1fr)'
            : 'minmax(0, 1fr)',
          blockSize: '100dvh',
        } as React.CSSProperties
      }
    >
      {hasHeaderRow ? (
        <header
          data-scope="app-shell"
          data-part="header"
          style={
            {
              // The trigger shares the row with whatever the host put in the
              // header, at the inline start — where all three reference
              // systems place it, and the only place it can be that does not
              // depend on the host's header content.
              alignItems: 'center',
              borderBlockEnd: HAIRLINE,
              // Regions have definite widths (grid tracks), so each is a
              // size container for the theme's cqi scales (ADR-011).
              containerType: 'inline-size',
              display: 'flex',
              gap: vars.spacing.gap.inline.sm,
            } as React.CSSProperties
          }
        >
          {trigger}
          {header}
        </header>
      ) : null}
      <ShellBody
        aside={aside ?? undefined}
        asideLabel={asideLabel}
        asideWidth={asideWidth}
        sidebar={isTemporary ? undefined : (sidebar ?? undefined)}
        sidebarLabel={sidebarLabel}
        sidebarWidth={sidebarWidth}
      >
        {children}
      </ShellBody>
      {drawer}
    </div>
  );
};
AppShell.displayName = appShellMeta.displayName;
