import { configCreator } from './configCreator';

const defaultConfig: any = {
  obj: { a: 1, b: 2 },
  arr: [1, 2, 3],
};

const config = configCreator(defaultConfig);

test('should append array', () => {
  expect(config({ arr: [4, 5] })).toEqual({
    obj: { a: 1, b: 2 },
    arr: [1, 2, 3, 4, 5],
  });
});

test('should overwrite array', () => {
  expect(
    config(
      { arr: [4, 5] },
      {
        arrayMerge: 'overwrite',
      }
    )
  ).toEqual({
    obj: { a: 1, b: 2 },
    arr: [4, 5],
  });
});

test('should add obj key', () => {
  expect(config({ obj: { c: 3 } })).toEqual({
    arr: [1, 2, 3],
    obj: { a: 1, b: 2, c: 3 },
  });
});
