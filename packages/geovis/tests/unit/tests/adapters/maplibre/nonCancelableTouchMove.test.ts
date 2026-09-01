/**
 * @jest-environment jsdom
 *
 * Guards the Chrome `[Intervention]` workaround: MapLibre calls
 * `preventDefault()` on every `touchmove` it handles, so a non-cancelable one
 * must reach it with `preventDefault` already neutralised, while a cancelable
 * one must keep working so pan and pinch-zoom stay intact.
 */

import { silenceNonCancelableTouchMove } from 'src/adapters/maplibre/nonCancelableTouchMove';

/**
 * Mirrors MapLibre's own listener: bubble phase on the canvas container,
 * calling `preventDefault()` unconditionally the way the touch handlers do.
 */
const mountMapLibreLikeListener = (container: HTMLElement) => {
  const shadowed: boolean[] = [];
  container.addEventListener('touchmove', (event) => {
    shadowed.push(event.preventDefault !== Event.prototype.preventDefault);
    event.preventDefault();
  });
  return shadowed;
};

const dispatchTouchMove = (cancelable: boolean) => {
  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);

  silenceNonCancelableTouchMove({
    getCanvasContainer: () => {
      return container;
    },
  });
  const shadowed = mountMapLibreLikeListener(container);

  const event = new Event('touchmove', { bubbles: true, cancelable });
  canvas.dispatchEvent(event);

  return { defaultPrevented: event.defaultPrevented, shadowed };
};

describe('silenceNonCancelableTouchMove', () => {
  test('neutralises preventDefault on a non-cancelable touchmove', () => {
    expect(dispatchTouchMove(false)).toEqual({
      defaultPrevented: false,
      shadowed: [true],
    });
  });

  test('leaves a cancelable touchmove fully cancelable', () => {
    expect(dispatchTouchMove(true)).toEqual({
      defaultPrevented: true,
      shadowed: [false],
    });
  });
});
