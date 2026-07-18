import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

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

/** Sidebar width from a named threshold scale (not a raw length). */
export type AppShellSidebarWidth = 'sm' | 'md' | 'lg';

const SIDEBAR_WIDTH: Record<AppShellSidebarWidth, string> = {
  sm: '13rem',
  md: '16rem',
  lg: '20rem',
};

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
  const start = hasSidebar ? `${SIDEBAR_WIDTH[sidebarWidth]} ` : '';
  const end = hasAside ? ` ${SIDEBAR_WIDTH[asideWidth]}` : '';
  return `${start}minmax(0, 1fr)${end}`;
};

const HAIRLINE = `${vars.border.outline.surface.width} ${vars.border.outline.surface.style} ${vars.colors.informational.muted.border?.default}`;

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
  children,
  ...props
}: AppShellProps) => {
  const hasSidebar = sidebar !== undefined && sidebar !== null;
  const hasAside = aside !== undefined && aside !== null;

  return (
    <div
      {...props}
      data-scope="app-shell"
      data-part="root"
      style={
        {
          display: 'grid',
          gridTemplateRows: header ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
          blockSize: '100dvh',
        } as React.CSSProperties
      }
    >
      {header ? (
        <header
          data-scope="app-shell"
          data-part="header"
          style={{ borderBlockEnd: HAIRLINE } as React.CSSProperties}
        >
          {header}
        </header>
      ) : null}
      <div
        data-scope="app-shell"
        data-part="body"
        style={
          {
            display: 'grid',
            gridTemplateColumns: bodyColumns({
              hasSidebar,
              hasAside,
              sidebarWidth,
              asideWidth,
            }),
            minBlockSize: 0,
          } as React.CSSProperties
        }
      >
        {hasSidebar ? (
          <aside
            data-scope="app-shell"
            data-part="sidebar"
            style={
              {
                overflowY: 'auto',
                borderInlineEnd: HAIRLINE,
              } as React.CSSProperties
            }
          >
            {sidebar}
          </aside>
        ) : null}
        <main
          data-scope="app-shell"
          data-part="main"
          style={{ overflow: 'auto', minInlineSize: 0 } as React.CSSProperties}
        >
          {children}
        </main>
        {hasAside ? (
          <aside
            data-scope="app-shell"
            data-part="aside"
            style={
              {
                overflowY: 'auto',
                borderInlineStart: HAIRLINE,
              } as React.CSSProperties
            }
          >
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
};
AppShell.displayName = appShellMeta.displayName;
