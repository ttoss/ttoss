/**
 * The Collection-row resting-fill contract (F-055) — P3 review round 4.
 *
 * `GridListItem`, `ListBoxItem` and `TableRow` are the Selection-entity items
 * ADR-007 splits out of a Collection container, and all three read
 * `input.primary.background.default` as their resting fill. In the base
 * theme's light mode that value is byte-identical to the container's own
 * `informational.primary.background.default` (both `neutral.0`), so the row
 * reads as flush against its container — correct, and by luck. The dark
 * alternate remaps `input.primary.background.default` to a text-field-style
 * filled box (`neutral.700`) while the container stays `neutral.900`: every
 * row rendered as a solid lighter block in dark mode, at rest, with no
 * hover or selection — the F-050/ADR-033 shape one family over.
 *
 * `resolveCollectionRowBackground` closes it by overriding only the
 * `default` key with the container's own background before running the
 * state cascade, so hover/active/selected keep the entity's own values and
 * only the resting fill borrows the container. Asserted from both sides:
 * the container's value is read at rest, and the entity's own `default` is
 * never reached — a refactor that reintroduces `c?.background?.default`
 * would fail the second assertion even if it left the first one passing.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from 'src/index';
import { resolveCollectionRowBackground } from 'src/tokens/collectionRow';

const itemBg = vars.colors.input.primary.background;
const containerBg = vars.colors.informational.primary.background?.default;

describe('resolveCollectionRowBackground', () => {
  test('at rest, the row reads the container background — not the entity default', () => {
    const resting = resolveCollectionRowBackground({
      itemBackground: itemBg,
      containerBackground: containerBg,
      flags: {},
    });

    expect(resting).toBe(containerBg);
    // The discriminant: without the override this call would have returned
    // the entity's own idiom, which the dark alternate deliberately diverges
    // from the container's.
    expect(resting).not.toBe(itemBg?.default);
  });

  test('hover/selected/disabled still read the entity own states, unaffected by the override', () => {
    expect(
      resolveCollectionRowBackground({
        itemBackground: itemBg,
        containerBackground: containerBg,
        flags: { isHovered: true },
      })
    ).toBe(itemBg?.hover);

    expect(
      resolveCollectionRowBackground({
        itemBackground: itemBg,
        containerBackground: containerBg,
        flags: { isSelected: true },
      })
    ).toBe(itemBg?.checked);

    expect(
      resolveCollectionRowBackground({
        itemBackground: itemBg,
        containerBackground: containerBg,
        flags: { isDisabled: true },
      })
    ).toBe(itemBg?.disabled);
  });
});

describe('GridListItem and ListBoxItem paint the container colour at rest', () => {
  test('GridListItem', () => {
    render(
      <GridList aria-label="Files" selectionMode="multiple">
        <GridListItem id="a" textValue="Report">
          Report.pdf
        </GridListItem>
      </GridList>
    );

    const item = document.querySelector<HTMLElement>(
      '[data-scope="grid-list"][data-part="item"]'
    );
    expect(item?.style.backgroundColor).toBe(containerBg);
    expect(item?.style.backgroundColor).not.toBe(itemBg?.default);
  });

  test('ListBoxItem', () => {
    render(
      <ListBox aria-label="Frameworks">
        <ListBoxItem id="react">React</ListBoxItem>
      </ListBox>
    );

    const item = document.querySelector<HTMLElement>(
      '[data-scope="list-box"][data-part="item"]'
    );
    expect(item?.style.backgroundColor).toBe(containerBg);
    expect(item?.style.backgroundColor).not.toBe(itemBg?.default);
  });

  test('TableRow', () => {
    render(
      <Table aria-label="Team">
        <TableHeader>
          <TableColumn id="name" isRowHeader>
            Name
          </TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="ada">
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const item = document.querySelector<HTMLElement>(
      '[data-scope="table"][data-part="item"]'
    );
    expect(item?.style.backgroundColor).toBe(containerBg);
    expect(item?.style.backgroundColor).not.toBe(itemBg?.default);
  });
});

// E2 C-05 — the container half of the split, stated once and shared.
describe('collection container chrome', () => {
  // Deep import on purpose: the builders are internal, not package exports.
  const {
    buildCollectionContainerEdge,
    buildCollectionContainerStyle,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('../../../src/tokens/collectionRow');

  test('the stacked container states the row-list layout once', () => {
    const style = buildCollectionContainerStyle();
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('column');
    expect(style.gap).toBe(vars.spacing.gap.stack.xs);
    // Row-framing gutter, not a page inset (F-045).
    expect(style.padding).toBe(vars.spacing.inset.surface.xs);
  });

  test('every collection host shares the edge and publishes its surface', () => {
    const edge = buildCollectionContainerEdge();
    expect(edge.borderRadius).toBe(vars.radii.surface);
    expect(edge.borderWidth).toBe(vars.border.outline.surface.width);
    expect(edge.borderStyle).toBe(vars.border.outline.surface.style);
    expect(edge.backgroundColor).toBe(
      vars.colors.informational.primary.background?.default
    );
    // Table consumes only the edge, so the edge must not impose a layout.
    expect(edge.display).toBeUndefined();
    expect(edge.gap).toBeUndefined();
    expect(edge.padding).toBeUndefined();
    // A surface with no declared edge keeps a verifiable value, not a hole.
    expect(buildCollectionContainerEdge({}).borderColor).toBe('transparent');
  });
});
