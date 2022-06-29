import { render, renderHook, setOptions, userEvent } from './';

test('methods should exist', () => {
  expect(render).toBeDefined();
  expect(renderHook).toBeDefined();
  expect(setOptions).toBeDefined();
  expect(userEvent).toBeDefined();
});

test('should define window.matchMedia', () => {
  expect(window.matchMedia).toBeDefined();
});
