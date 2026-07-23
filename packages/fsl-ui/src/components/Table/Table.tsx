import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Cell as RACCell,
  type CellProps as RACCellProps,
  Column as RACColumn,
  type ColumnProps as RACColumnProps,
  Row as RACRow,
  type RowProps as RACRowProps,
  Table as RACTable,
  TableBody as RACTableBody,
  type TableBodyProps as RACTableBodyProps,
  TableHeader as RACTableHeader,
  type TableHeaderProps as RACTableHeaderProps,
  type TableProps as RACTableProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { Icon } from '../Icon';

/**
 * Sorting state types, re-exported so consumers type
 * `sortDescriptor`/`onSortChange` without depending on
 * `react-aria-components` directly (friction F-011).
 */
export type { SortDescriptor, SortDirection } from 'react-aria-components';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1 (per-part entity split, ADR-007)
//
// Same split as GridList/ListBox: the CONTAINER is Entity = Collection
// (`informational` surface — the framed grid of rows), each ROW is Entity =
// Selection (`input` chrome, `selected` State). Column headers map to the
// Collection `title` structural role and cells to `content` — the ROADMAP B2
// mapping, which required no taxonomy addition. TableHeader/TableBody are
// internal frame parts (data-part only, no meta — DialogTrigger precedent).
//
// Scope (evidence rule): selection is row-click driven (React Aria
// `selectionBehavior`); a dedicated checkbox selection column ships only
// when a real consumer demands bulk actions. Column resizing and
// virtualization stay deferred (ROADMAP B2 notes).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Table root (Collection entity, surface). */
export const tableMeta = {
  displayName: 'Table',
  entity: 'Collection',
  structure: 'root',
} as const satisfies ComponentMeta<'Collection'>;

/** Formal semantic identity — TableColumn header (Collection `title` role). */
export const tableColumnMeta = {
  displayName: 'TableColumn',
  entity: 'Collection',
  structure: 'title',
} as const satisfies ComponentMeta<'Collection'>;

/** Formal semantic identity — TableRow (Selection entity, selectable row). */
export const tableRowMeta = {
  displayName: 'TableRow',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

/** Formal semantic identity — TableCell (Collection `content` role). */
export const tableCellMeta = {
  displayName: 'TableCell',
  entity: 'Collection',
  structure: 'content',
} as const satisfies ComponentMeta<'Collection'>;

type InputColors = typeof vars.colors.input.primary;

/** Props for the Table component. */
export type TableProps = Omit<RACTableProps, 'style' | 'className'>;

/**
 * A semantic data table built on React Aria's `Table` — column headers,
 * keyboard grid navigation, sorting, and row selection.
 *
 * Per ADR-007 the CONTAINER is Entity = Collection (an `informational`
 * surface) and each `TableRow` is Entity = Selection (`input` chrome, the
 * `selected` State). Compose `TableHeader` + `TableColumn` for the header
 * and `TableBody` + `TableRow` + `TableCell` for the data. Sorting is
 * controlled via `sortDescriptor`/`onSortChange` with `allowsSorting` on the
 * sortable columns. Row selection uses React Aria's `selectionMode`;
 * clicking a row toggles it (there is no checkbox column yet — it ships
 * when a consumer demands bulk actions).
 *
 * @example
 * ```tsx
 * <Table aria-label="Team" sortDescriptor={sort} onSortChange={setSort}>
 *   <TableHeader>
 *     <TableColumn id="name" isRowHeader allowsSorting>Name</TableColumn>
 *     <TableColumn id="role">Role</TableColumn>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow id="ada">
 *       <TableCell>Ada Lovelace</TableCell>
 *       <TableCell>Admin</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
export const Table = (props: TableProps) => {
  const surface = vars.colors.informational.primary;

  return (
    <RACTable
      {...props}
      data-scope="table"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        inlineSize: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        borderRadius: vars.radii.surface,
        borderWidth: vars.border.outline.surface.width,
        borderStyle: vars.border.outline.surface.style,
        borderColor: surface?.border?.default ?? 'transparent',
        backgroundColor: surface?.background?.default,
        color: surface?.text?.default,
      }}
    />
  );
};
Table.displayName = tableMeta.displayName;

/** Props for the TableHeader frame. */
export type TableHeaderProps<T extends object = object> = Omit<
  RACTableHeaderProps<T>,
  'style' | 'className'
>;

/**
 * The header row group. An internal frame part — place `TableColumn`s
 * inside it.
 */
export const TableHeader = <T extends object = object>(
  props: TableHeaderProps<T>
) => {
  return <RACTableHeader {...props} data-scope="table" data-part="header" />;
};
TableHeader.displayName = 'TableHeader';

/** Props for a TableColumn header cell. */
export type TableColumnProps = Omit<
  RACColumnProps,
  'style' | 'className' | 'children'
> & {
  /**
   * Column header content. Plain nodes only — the column owns its render
   * prop internally (label + sort-direction indicator).
   */
  children?: React.ReactNode;
};

/**
 * A column header (Collection `title` role). With `allowsSorting`, React
 * Aria makes it a keyboard-operable sort control (`aria-sort` included) and
 * the current direction renders as an arrow Icon
 * (`action.sortAscending` / `action.sortDescending`).
 *
 * Set `isRowHeader` on the column whose cells name the row for assistive
 * technology.
 */
export const TableColumn = ({ children, ...props }: TableColumnProps) => {
  const colors = vars.colors.informational.muted;

  return (
    <RACColumn
      {...props}
      data-scope="table"
      data-part="title"
      style={({ allowsSorting, isHovered, isFocusVisible }) => {
        return {
          boxSizing: 'border-box',
          textAlign: 'start',
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          ...(vars.text.label.sm as React.CSSProperties),
          cursor: allowsSorting ? 'pointer' : undefined,
          transitionProperty: 'color',
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          color: allowsSorting
            ? resolveInteractiveStyle(colors?.text, { isHovered })
            : colors?.text?.default,
          borderBlockEndWidth: vars.border.divider.width,
          borderBlockEndStyle: vars.border.divider
            .style as React.CSSProperties['borderBlockEndStyle'],
          borderBlockEndColor: colors?.border?.default ?? 'transparent',
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: '-2px',
        };
      }}
    >
      {({ allowsSorting, sortDirection }) => {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: vars.spacing.gap.inline.sm,
            }}
          >
            {children}
            {allowsSorting && sortDirection && (
              <Icon
                intent={
                  sortDirection === 'ascending'
                    ? 'action.sortAscending'
                    : 'action.sortDescending'
                }
                size="sm"
              />
            )}
          </span>
        );
      }}
    </RACColumn>
  );
};
TableColumn.displayName = tableColumnMeta.displayName;

/** Props for the TableBody frame. */
export type TableBodyProps<T extends object = object> = Omit<
  RACTableBodyProps<T>,
  'style' | 'className'
>;

/** The data row group. An internal frame part — place `TableRow`s inside. */
export const TableBody = <T extends object = object>(
  props: TableBodyProps<T>
) => {
  return <RACTableBody {...props} data-scope="table" data-part="body" />;
};
TableBody.displayName = 'TableBody';

/** Props for a TableRow. */
export type TableRowProps<T extends object = object> = Omit<
  RACRowProps<T>,
  'style' | 'className'
>;

/**
 * A single data row. Entity = Selection → reads `vars.colors.input.*` and
 * surfaces the `selected` State when the parent Table has a `selectionMode`.
 */
export const TableRow = <T extends object = object>(
  props: TableRowProps<T>
) => {
  const c: InputColors = vars.colors.input.primary;

  return (
    <RACRow
      {...props}
      data-scope="table"
      data-part="item"
      style={({
        isSelected,
        isHovered,
        isFocusVisible,
        isDisabled,
        selectionMode,
      }) => {
        return {
          boxSizing: 'border-box',
          blockSize: vars.sizing.hit,
          cursor:
            selectionMode === 'none'
              ? undefined
              : isDisabled
                ? 'not-allowed'
                : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          transitionProperty: 'background-color, color',
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          backgroundColor: resolveInteractiveStyle(c?.background, {
            isDisabled,
            isSelected,
            isHovered: isHovered && selectionMode !== 'none',
          }),
          color: resolveInteractiveStyle(c?.text, {
            isDisabled,
            isSelected,
          }),
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: '-2px',
        };
      }}
    />
  );
};
TableRow.displayName = tableRowMeta.displayName;

/** Props for a TableCell. */
export type TableCellProps = Omit<RACCellProps, 'style' | 'className'>;

/**
 * A data cell (Collection `content` role). Focusable during keyboard grid
 * navigation; typography and color inherit from the row.
 */
export const TableCell = (props: TableCellProps) => {
  const colors = vars.colors.informational.muted;

  return (
    <RACCell
      {...props}
      data-scope="table"
      data-part="content"
      style={({ isFocusVisible }) => {
        return {
          boxSizing: 'border-box',
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          ...(vars.text.body.sm as React.CSSProperties),
          borderBlockEndWidth: vars.border.divider.width,
          borderBlockEndStyle: vars.border.divider
            .style as React.CSSProperties['borderBlockEndStyle'],
          borderBlockEndColor: colors?.border?.default ?? 'transparent',
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: '-2px',
        };
      }}
    />
  );
};
TableCell.displayName = tableCellMeta.displayName;
