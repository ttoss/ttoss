/**
 * Resolves once the browser has painted the current frame.
 *
 * A single `requestAnimationFrame` fires *before* the frame it belongs to is
 * painted, so work started there still holds that paint back. The second one
 * fires in the next frame, after the first has reached the screen — which is
 * what the export dialog needs before it starts a capture heavy enough to
 * freeze the page.
 *
 * @returns A promise that settles after the next paint.
 *
 * @example
 * await waitForPaint(); // the dialog is on screen now
 */
export const waitForPaint = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
};
