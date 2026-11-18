import { changedViewFields } from 'src/react/mapMode.split';

describe('changedViewFields', () => {
  test('nothing on the first build or for the same view', () => {
    const view = { pitch: 10 };
    expect(changedViewFields(null, view)).toEqual({});
    expect(changedViewFields(view, view)).toEqual({});
  });

  test('only the fields the app changed', () => {
    expect(
      changedViewFields(
        { center: [0, 0], zoom: 3, pitch: 0, bearing: 0 },
        { center: [0, 0], zoom: 3, pitch: 45, bearing: -20 }
      )
    ).toEqual({ pitch: 45, bearing: -20 });
    expect(
      changedViewFields(
        { center: [0, 0], zoom: 3 },
        { center: [1, 0], zoom: 4 }
      )
    ).toEqual({ center: [1, 0], zoom: 4 });
  });

  test('a field the new view leaves out is not a change', () => {
    expect(changedViewFields({ pitch: 30 }, {})).toEqual({});
    expect(changedViewFields(undefined, { zoom: 5 })).toEqual({ zoom: 5 });
  });
});
