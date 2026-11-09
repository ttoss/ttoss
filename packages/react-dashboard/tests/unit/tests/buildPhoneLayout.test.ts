import {
  buildBreakpointLayouts,
  buildPhoneLayout,
} from 'src/utils/buildPhoneLayout';

const tile = (i: string, x: number, y: number) => {
  return { i, x, y, w: 3, h: 3 };
};

const divider = (i: string, y: number) => {
  return { i, x: 0, y, w: 12, h: 2 };
};

const positions = (items: ReturnType<typeof buildPhoneLayout>) => {
  return items.map(({ i, x, y, w }) => {
    return { i, x, y, w };
  });
};

test('quarter-width cards sit two per row, in reading order', () => {
  const layout = buildPhoneLayout({
    items: [tile('d', 9, 0), tile('a', 0, 0), tile('c', 6, 0), tile('b', 3, 0)],
  });

  expect(positions(layout)).toEqual([
    { i: 'a', x: 0, y: 0, w: 1 },
    { i: 'b', x: 1, y: 0, w: 1 },
    { i: 'c', x: 0, y: 3, w: 1 },
    { i: 'd', x: 1, y: 3, w: 1 },
  ]);
});

test('a wider card or a section divider takes the full row and closes an odd row', () => {
  const layout = buildPhoneLayout({
    items: [
      divider('section', 0),
      tile('a', 0, 2),
      tile('b', 3, 2),
      tile('c', 6, 2),
      { i: 'chart', x: 0, y: 5, w: 6, h: 8 },
      tile('d', 0, 13),
    ],
  });

  expect(positions(layout)).toEqual([
    { i: 'section', x: 0, y: 0, w: 2 },
    { i: 'a', x: 0, y: 2, w: 1 },
    { i: 'b', x: 1, y: 2, w: 1 },
    { i: 'c', x: 0, y: 5, w: 1 },
    { i: 'chart', x: 0, y: 8, w: 2 },
    { i: 'd', x: 0, y: 16, w: 1 },
  ]);
});

test('a row is as tall as its tallest card', () => {
  const layout = buildPhoneLayout({
    items: [
      { i: 'short', x: 0, y: 0, w: 3, h: 2 },
      { i: 'tall', x: 3, y: 0, w: 3, h: 5 },
      tile('next', 6, 0),
    ],
  });

  expect(
    layout.find((item) => {
      return item.i === 'next';
    })?.y
  ).toBe(5);
});

test('desktop width bounds do not reach the phone layout', () => {
  const [item] = buildPhoneLayout({
    items: [{ i: 'a', x: 0, y: 0, w: 3, h: 3, minW: 3, maxW: 6 }],
  });

  expect(item).toEqual({ i: 'a', x: 0, y: 0, w: 1, h: 3 });
});

test('phone breakpoints get the reflow; wider ones keep the template layout', () => {
  const base = [tile('a', 0, 0), tile('b', 3, 0)];

  const layouts = buildBreakpointLayouts({ base, isEditMode: false });

  expect(layouts.xs).toEqual(buildPhoneLayout({ items: base }));
  expect(layouts.sm).toEqual(layouts.xs);
  expect(layouts.md).toBe(base);
  expect(layouts['2xl']).toBe(base);
});

test('in edit mode the phone keeps the template layout', () => {
  const base = [tile('a', 0, 0), tile('b', 3, 0)];

  const layouts = buildBreakpointLayouts({ base, isEditMode: true });

  expect(layouts.xs).toBe(base);
  expect(layouts.sm).toBe(base);
});
