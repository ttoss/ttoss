import type { LayoutItem } from 'react-grid-layout';

/** Columns of the phone grid: `COLS.xs` and `COLS.sm` in `DashboardGrid`. */
export const PHONE_COLS = 2;

/**
 * Widest desktop card (out of 12 columns) that takes one phone column. A
 * quarter-width card is a KPI tile: full width on a phone it leaves most of
 * the row empty and stretches the page.
 */
export const PHONE_HALF_MAX_W = 3;

/**
 * Reflows a 12-column desktop layout for the 2-column phone grid: cards at
 * most a quarter of the desktop width sit two per row, wider cards and
 * section dividers take the full row, in the desktop's reading order.
 *
 * Without it, react-grid-layout clamps every card to the 2 phone columns, so
 * each one fills its own row.
 */
export const buildPhoneLayout = ({
  items,
}: {
  items: LayoutItem[];
}): LayoutItem[] => {
  const inReadingOrder = [...items].sort((a, b) => {
    return a.y - b.y || a.x - b.x;
  });

  const placed: LayoutItem[] = [];
  let y = 0;
  let column = 0;
  let rowHeight = 0;

  const closeRow = () => {
    if (column > 0) {
      y += rowHeight;
      column = 0;
      rowHeight = 0;
    }
  };

  for (const desktopItem of inReadingOrder) {
    // A desktop width bound (e.g. minW 3) would push a phone card back to
    // full width.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { minW, maxW, ...item } = desktopItem;

    if (item.w > PHONE_HALF_MAX_W) {
      closeRow();
      placed.push({ ...item, x: 0, y, w: PHONE_COLS });
      y += item.h;
      continue;
    }

    placed.push({ ...item, x: column, y, w: 1 });
    rowHeight = Math.max(rowHeight, item.h);
    column += 1;

    if (column === PHONE_COLS) {
      closeRow();
    }
  }

  return placed;
};

/**
 * The layout per breakpoint, phones reflowed. Edit mode keeps the desktop
 * layout on a phone: `onLayoutChange` saves the current breakpoint's layout,
 * so a reflowed one would overwrite the template's desktop positions.
 */
export const buildBreakpointLayouts = ({
  base,
  isEditMode,
}: {
  base: LayoutItem[];
  isEditMode: boolean;
}) => {
  const phone = isEditMode ? base : buildPhoneLayout({ items: base });
  return { xs: phone, sm: phone, md: base, lg: base, xl: base, '2xl': base };
};
