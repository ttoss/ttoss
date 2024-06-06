/* eslint-disable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
function annotation(target: any) {
  target.annotated = true;
}

@annotation
class MyClass {
  static annotated: boolean;
}

test('babel should transpile decorator for testing purpose', () => {
  expect(MyClass.annotated).toBe(true);
});
