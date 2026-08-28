/**
 * List — Structure-entity content list.
 *
 * The assertions that matter are the semantic ones: a `Stack` already produces
 * this layout, and what it cannot produce is a list a screen reader announces
 * as one. Everything else here is the rhythm coming from the theme rather than
 * from a hand-written gap.
 */
import { render, screen } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { List, ListItem, listItemMeta, listMeta } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="list"][data-part="root"]'
  );
};

describe('List', () => {
  test('both parts are Structure — presentation, not a collection', () => {
    // The distinction from `ListBox`/`GridList`, which are Collection entities
    // with keyboard navigation. This one is read, not operated.
    expect(listMeta.entity).toBe('Structure');
    expect(listItemMeta.entity).toBe('Structure');
    expect(listItemMeta.structure).toBe('content');
  });

  test('announces as a list — the thing a Stack of Texts cannot do', () => {
    render(
      <List>
        <ListItem>one</ListItem>
        <ListItem>two</ListItem>
      </List>
    );
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('keeps list semantics while hiding the marker (the default)', () => {
    // `plain` is the shape most product lists want, and the one otherwise
    // hand-rolled with `list-style: none` on a div that announces nothing.
    render(
      <List>
        <ListItem>one</ListItem>
      </List>
    );
    const el = root()!;
    expect(el.tagName).toBe('UL');
    expect(el.style.listStyle).toBe('none');
    // The browser reserves indent for a marker that is not drawn — reclaimed
    // here rather than left as the hanging space every reset strips by hand.
    expect(el.style.paddingInlineStart).toBe('0');
    expect(screen.getByRole('list')).toBeVisible();
  });

  test('variant=ordered switches the element, not just the marker', () => {
    render(
      <List variant="ordered">
        <ListItem>one</ListItem>
      </List>
    );
    const el = root()!;
    expect(el.tagName).toBe('OL');
    expect(el).toHaveAttribute('data-variant', 'ordered');
    // The marker is the browser's; the component states no opinion.
    expect(el.style.listStyle).toBe('');
    expect(el.style.paddingInlineStart).toBe('');
  });

  test('variant=unordered keeps the marker on a ul', () => {
    render(
      <List variant="unordered">
        <ListItem>one</ListItem>
      </List>
    );
    const el = root()!;
    expect(el.tagName).toBe('UL');
    expect(el.style.listStyle).toBe('');
  });

  test.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'gap=%s reads the stacking scale, never a raw length',
    (gap) => {
      render(
        <List gap={gap}>
          <ListItem>one</ListItem>
        </List>
      );
      expect(root()?.style.gap).toBe(vars.spacing.gap.stack[gap]);
    }
  );

  test('paints nothing — the ink belongs to what the caller puts inside', () => {
    render(
      <List>
        <ListItem>one</ListItem>
      </List>
    );
    const el = root()!;
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.color).toBe('');
  });
});
