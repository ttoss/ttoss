import {
  findGroupIdForValue,
  resolveInitialGroupId,
  resolveMenus,
} from 'src/menus';

const groups = [
  {
    id: 'g1',
    label: 'G1',
    items: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  },
  { id: 'g2', label: 'G2', items: [{ value: 'c', label: 'C' }] },
];

describe('resolveMenus', () => {
  test('reads controls.menus first', () => {
    const menus = [
      { id: 'm', title: 'M', items: [{ value: 'x', label: 'X' }] },
    ];
    expect(resolveMenus({ controls: { menus } })).toBe(menus);
  });

  test('falls back to the leftSidebar.menus alias', () => {
    const menus = [
      { id: 'm', title: 'M', items: [{ value: 'x', label: 'X' }] },
    ];
    expect(resolveMenus({ leftSidebar: { menus } })).toBe(menus);
  });

  test('returns an empty array when neither is set', () => {
    expect(resolveMenus({})).toEqual([]);
  });
});

describe('findGroupIdForValue', () => {
  test('returns the id of the group holding the value', () => {
    expect(findGroupIdForValue({ groups, value: 'c' })).toBe('g2');
  });

  test('returns undefined when no group holds the value', () => {
    expect(findGroupIdForValue({ groups, value: 'z' })).toBeUndefined();
  });

  test('returns undefined when the value itself is undefined', () => {
    expect(findGroupIdForValue({ groups, value: undefined })).toBeUndefined();
  });
});

describe('resolveInitialGroupId', () => {
  test('prefers a defaultGroupId that names a real group', () => {
    expect(
      resolveInitialGroupId({
        menu: { id: 'm', groups, defaultGroupId: 'g2', defaultValue: 'a' },
      })
    ).toBe('g2');
  });

  test('ignores a defaultGroupId that matches no group, using the value group', () => {
    expect(
      resolveInitialGroupId({
        menu: { id: 'm', groups, defaultGroupId: 'nope', defaultValue: 'a' },
      })
    ).toBe('g1');
  });

  test('falls back to the group holding defaultValue', () => {
    expect(
      resolveInitialGroupId({ menu: { id: 'm', groups, defaultValue: 'c' } })
    ).toBe('g2');
  });

  test('falls back to the first group when nothing else matches', () => {
    expect(resolveInitialGroupId({ menu: { id: 'm', groups } })).toBe('g1');
  });

  test('returns undefined for a menu with no groups', () => {
    expect(
      resolveInitialGroupId({ menu: { id: 'm', groups: [] } })
    ).toBeUndefined();
  });
});
